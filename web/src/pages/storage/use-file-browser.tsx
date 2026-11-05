import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode
} from 'react';
import { useAuth } from '@/contexts/auth.ts';
import { App, Breadcrumb, Button, Input, Modal, Segmented, Select, Tooltip } from 'antd';
import clsx from 'clsx';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CornerLeftUpIcon,
  DownloadIcon,
  FolderIcon,
  FolderPlusIcon,
  FolderUpIcon,
  LayoutGridIcon,
  ListIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/media.ts';
import { extension } from '@/lib/file-names.ts';
import { formatSize } from '@/lib/format.ts';
import { FileTypeIcon } from '@/lib/media-icons.tsx';

type SortKey = 'name' | 'size' | 'type' | 'modified';
type ViewMode = 'list' | 'grid';

type Props = {
  active: boolean;
  // The medium whose files the panel is showing; null while it is unavailable.
  media: api.MediaItem | null;
  // True while the target machine holds the data partition. Every medium lives
  // on it, so nothing here may be written then: the two sides cache the exFAT
  // allocation tables independently.
  dataOwned: boolean;
  // False while /data is mounted read-only, which is how the partition looks
  // before the mount has been handed back.
  localWritable: boolean;
  path: string;
  onPathChange: (path: string) => void;
  // Incremented while the shared disk is attached so the listing re-reads.
  changeSignal: number;
  // Fired when a transfer touched a medium the panel is not browsing, so the
  // page can refresh its medium list.
  onMediaChanged: () => void;
  // Fired when a name was refused because it already exists: the caller has
  // already shown that in the user's language, and the failed media job behind
  // it must not raise a second, English one.
  onNameTaken: (name: string) => void;
  onError: (message: string) => void;
};

// The listing remembers the view it was last opened in across visits.
const viewModeKey = 'nanokvm-files-view';

function readViewMode(): ViewMode {
  try {
    return localStorage.getItem(viewModeKey) === 'grid' ? 'grid' : 'list';
  } catch {
    return 'list';
  }
}

function childPath(parent: string, name: string): string {
  return parent === '/' ? `/${name}` : `${parent}/${name}`;
}

// joinPath appends a relative path (which may hold separators) to the folder
// the browser is showing.
function joinPath(base: string, relative: string): string {
  const joined = `${base.replace(/\/+$/, '')}/${relative}`.replace(/\/{2,}/g, '/');
  return joined === '' ? '/' : joined;
}

function dirnameOf(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? '' : path.slice(0, index);
}

// parentDirectories returns every folder above a relative file path, so an
// upload can create the tree shallowest first.
function parentDirectories(path: string): string[] {
  const parts = path.split('/').slice(0, -1);
  const directories: string[] = [];
  for (let i = 1; i <= parts.length; i++) {
    directories.push(parts.slice(0, i).join('/'));
  }
  return directories;
}

// A file a folder picker returns carries its path inside the picked folder;
// a plain picker returns none, and then the name is the whole path.
function relativePathOf(file: File): string {
  const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return path && path.length > 0 ? path : file.name;
}

type DroppedFile = { path: string; file: File };

// collectDroppedEntries walks a drop. The transfer's items are only readable
// while the event is being handled, so every entry is taken before the first
// await; the folders below them are then walked asynchronously. Folders that
// hold nothing come back in directories - a file list alone cannot represent
// them.
async function collectDroppedEntries(transfer: DataTransfer): Promise<{
  entries: DroppedFile[];
  directories: string[];
}> {
  const roots: FileSystemEntry[] = [];
  const plain: File[] = [];
  // The transfer is only readable while the event is handled, so the plain
  // file list is taken here too: it is the fallback for a browser or a drop
  // source that exposes no entries.
  const dropped = Array.from(transfer.files ?? []);

  for (const item of Array.from(transfer.items ?? [])) {
    if (item.kind !== 'file') continue;
    const getEntry = (
      item as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntry | null }
    ).webkitGetAsEntry;
    const entry = typeof getEntry === 'function' ? getEntry.call(item) : null;
    if (entry) {
      roots.push(entry);
    } else {
      const file = item.getAsFile();
      if (file) plain.push(file);
    }
  }

  if (roots.length === 0) {
    const files = plain.length > 0 ? plain : dropped;
    return {
      entries: files.map((file) => ({ path: file.name, file })),
      directories: []
    };
  }

  const entries: DroppedFile[] = [];
  const directories: string[] = [];

  const walk = async (entry: FileSystemEntry, base: string): Promise<void> => {
    const path = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory) {
      directories.push(path);
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
          reader.readEntries(resolve, reject);
        });
        if (batch.length === 0) break;
        for (const child of batch) await walk(child, path);
      }
      return;
    }

    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    entries.push({ path, file });
  };

  for (const root of roots) await walk(root, '');
  return { entries, directories };
}

// A browser upload in flight. The page shows it next to the media job that
// reports its progress, with a button that aborts the request.
export type FileUpload = {
  id: number;
  name: string;
  cancel: () => void;
};

// How recent a zero-length entry has to be to be the one being written. The
// server reports "a transfer may be running" for the whole medium, so an empty
// file created an hour ago must not borrow that flag: it is empty, not busy.
const writingWindowMs = 15_000;

function isWritingEntry(entry: api.MediaFileEntry, writing: boolean | undefined): boolean {
  if (!writing || entry.size !== 0) {
    return false;
  }

  const modified = Date.parse(entry.modifiedAt);
  if (!Number.isFinite(modified)) {
    return false;
  }

  // A copy keeps touching the file, so its timestamp stays close to now; a
  // clock that is ahead of this browser only makes the entry look newer.
  return Date.now() - modified <= writingWindowMs;
}

function sortEntries(entries: api.MediaFileEntry[], sortKey: SortKey, sortAsc: boolean) {
  return [...entries].sort((a, b) => {
    // Folders stay ahead of files; the chosen key sorts inside each group.
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;

    let compared: number;
    if (sortKey === 'size') {
      compared = a.size - b.size;
    } else if (sortKey === 'type') {
      compared = extension(a.name).localeCompare(extension(b.name));
    } else if (sortKey === 'modified') {
      compared = Date.parse(a.modifiedAt) - Date.parse(b.modifiedAt);
    } else {
      compared = a.name.localeCompare(b.name);
    }
    if (compared === 0) compared = a.name.localeCompare(b.name);
    return sortAsc ? compared : -compared;
  });
}

// The time a listing carries is an ISO string; the column shows it in the
// browser's own short format.
function formatModified(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return '';
  return new Date(time).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

// The file browser owns its upload and refresh controls. An upload is refused
// while the target machine is holding the partition, since both operations
// write onto the same filesystem. The hidden input goes through overlays,
// where it cannot disturb the layout.
export function useFileBrowser({
  active,
  media,
  dataOwned,
  localWritable,
  path,
  onPathChange,
  changeSignal,
  onMediaChanged,
  onNameTaken,
  onError
}: Props) {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const { hasPermission } = useAuth();

  // A listing remembers the medium and folder it was read from: right after
  // the user moves elsewhere it still holds the old entries, and acting on
  // those under the new path would download or delete the wrong file.
  const [listing, setListing] = useState<{ key: string; files: api.MediaFiles } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Every upload running from this panel, so two uploads in a row do not
  // share one busy flag and each one can be cancelled on its own.
  const [uploads, setUploads] = useState<(FileUpload & { targetType: api.MediaType })[]>([]);
  const uploadId = useRef(0);
  const [expandedDirs, setExpandedDirs] = useState<Record<string, api.MediaFiles>>({});
  const expandedDirsRef = useRef(expandedDirs);
  expandedDirsRef.current = expandedDirs;
  const [expandingDirs, setExpandingDirs] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewModeState] = useState<ViewMode>(readViewMode);
  const [isDragging, setIsDragging] = useState(false);
  const [isMkdirOpen, setIsMkdirOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isMkdirBusy, setIsMkdirBusy] = useState(false);
  const mkdirTarget = useRef('/');
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<{ target: api.MediaItem; dir: string } | null>(null);
  const uploadControllers = useRef(new Set<AbortController>());
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const controllers = uploadControllers.current;
    return () => {
      for (const controller of controllers) controller.abort();
      controllers.clear();
    };
  }, []);

  useEffect(() => {
    // React has no typing for it, and setting it from JS keeps the markup free
    // of a non-standard attribute.
    folderInputRef.current?.setAttribute('webkitdirectory', '');
  }, []);

  const canBrowse = !!media;

  // Writing into the shared partition is a target-machine operation
  // (medium.attach); writing into an image changes what the library keeps
  // (library.write). A medium the target machine is holding is read-only no
  // matter which grant the account has.
  const canWrite =
    canBrowse &&
    !dataOwned &&
    localWritable &&
    hasPermission(media?.type === 'partition' ? 'medium.attach' : 'library.write');

  const isBrowsed = useCallback(
    (target: api.MediaItem) =>
      canBrowse && !!media && media.type === target.type && media.rel === target.rel,
    [canBrowse, media]
  );

  // The medium list is re-read on a timer, which hands this panel a new object
  // for the same medium every few seconds. The listing hangs on the medium's
  // identity - its type and id - not on that object, or every poll would
  // re-list the folder and clear the search.
  const mediaType = media?.type;
  const mediaRel = media?.rel;
  const locationKey = `${mediaType ?? ''}:${mediaRel ?? ''}:${path}`;
  const files = listing?.key === locationKey ? listing.files : null;

  // watchQuery names every directory this panel is showing. The server watches
  // it to publish "the shared files changed"; a change inside an expanded
  // folder does not move its parent's signature, so all of them are listed and
  // not just the one being read.
  const watchQuery = useCallback(
    (extra?: string) => {
      const paths = new Set([path, ...Object.keys(expandedDirsRef.current)]);
      if (extra) paths.add(extra);
      // JSON rather than a comma separated list: a folder name may contain a
      // comma, and splitting on it would watch the wrong directories.
      return JSON.stringify([...paths]);
    },
    [path]
  );

  // Every listing carries a number: an answer that arrives after a newer
  // request belongs to a folder the user has already left.
  const listingId = useRef(0);
  const expandedGeneration = useRef(0);

  const refresh = useCallback(async () => {
    // Leaving for a medium that cannot be browsed still has to outdate a
    // listing in flight for the previous one.
    const id = ++listingId.current;
    if (!activeRef.current) return;
    if (!mediaType || !canBrowse) {
      setListing(null);
      setIsLoading(false);
      return;
    }

    const key = `${mediaType}:${mediaRel ?? ''}:${path}`;
    setIsLoading(true);
    try {
      const rsp = await api.listMediaFiles({
        type: mediaType,
        rel: mediaRel ?? '',
        path,
        watch: watchQuery()
      });
      if (!activeRef.current || id !== listingId.current) return;
      if (rsp.code === 0) {
        setListing({ key, files: rsp.data });
        // Refresh expanded folders in place. Apply only to the same cached
        // expansion, so a response cannot reopen a folder the user collapsed.
        const generation = expandedGeneration.current;
        for (const [directoryPath, previous] of Object.entries(expandedDirsRef.current)) {
          if (!activeRef.current || id !== listingId.current) return;
          const expandedRsp = await api.listMediaFiles({
            type: mediaType,
            rel: mediaRel ?? '',
            path: directoryPath,
            watch: watchQuery()
          });
          if (
            !activeRef.current ||
            id !== listingId.current ||
            generation !== expandedGeneration.current
          )
            return;
          if (expandedRsp.code === 0) {
            setExpandedDirs((current) =>
              current[directoryPath] === previous
                ? { ...current, [directoryPath]: expandedRsp.data }
                : current
            );
          }
        }
      } else {
        onError(rsp.msg);
      }
    } catch {
      if (activeRef.current && id === listingId.current) onError(t('storage.failed'));
    } finally {
      if (id === listingId.current) setIsLoading(false);
    }
  }, [mediaType, mediaRel, path, canBrowse, onError, t, watchQuery]);

  // An upload or a delete finishes long after the render that started it, so
  // those continuations refresh through this ref: they must re-read what the
  // user is looking at now, not the folder they were looking at before.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (active) void refresh();
  }, [active, refresh, changeSignal]);

  // Searching filters the folder being shown; carrying the text into another
  // folder would mostly produce empty-looking listings.
  useEffect(() => {
    setQuery('');
  }, [mediaType, mediaRel, path]);

  // Expanded directories belong to the current medium and path. Polling the
  // current listing must not change the user's open/closed choices.
  useEffect(() => {
    expandedGeneration.current += 1;
    setExpandedDirs({});
    setExpandingDirs({});
  }, [mediaType, mediaRel, path]);

  const entries = files?.entries ?? [];

  const trimmedQuery = query.trim().toLowerCase();
  const visibleEntries = sortEntries(
    trimmedQuery
      ? entries.filter((entry) => entry.name.toLowerCase().includes(trimmedQuery))
      : entries,
    sortKey,
    sortAsc
  );

  function setViewMode(mode: ViewMode) {
    setViewModeState(mode);
    try {
      localStorage.setItem(viewModeKey, mode);
    } catch {
      // Remembered for this visit only.
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function openDir(directoryPath: string) {
    onPathChange(directoryPath);
  }

  async function toggleDir(directoryPath: string) {
    if (expandedDirs[directoryPath]) {
      setExpandedDirs((current) => {
        const next = { ...current };
        for (const key of Object.keys(next)) {
          if (key === directoryPath || key.startsWith(`${directoryPath}/`)) {
            delete next[key];
          }
        }
        return next;
      });
      return;
    }
    if (expandingDirs[directoryPath] || !mediaType) return;

    const generation = expandedGeneration.current;
    setExpandingDirs((current) => ({ ...current, [directoryPath]: true }));
    try {
      const rsp = await api.listMediaFiles({
        type: mediaType,
        rel: mediaRel ?? '',
        path: directoryPath,
        watch: watchQuery(directoryPath)
      });
      if (generation !== expandedGeneration.current) return;
      if (rsp.code !== 0) {
        onError(rsp.msg);
        return;
      }
      setExpandedDirs((current) => ({ ...current, [directoryPath]: rsp.data }));
    } catch {
      if (generation === expandedGeneration.current) {
        onError(t('storage.failed'));
      }
    } finally {
      if (generation === expandedGeneration.current) {
        setExpandingDirs((current) => {
          const next = { ...current };
          delete next[directoryPath];
          return next;
        });
      }
    }
  }

  function openParent() {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    onPathChange(parts.length ? `/${parts.join('/')}` : '/');
  }

  // uploadOne reports false when the user stopped it: the batch that started it
  // stops there instead of queueing the rest behind a cancelled transfer.
  async function uploadOne(
    target: api.MediaItem,
    dir: string,
    file: File,
    refreshAfter = true
  ): Promise<boolean> {
    const id = ++uploadId.current;
    const controller = new AbortController();
    uploadControllers.current.add(controller);
    setUploads((current) => [
      ...current,
      {
        id,
        name: file.name,
        targetType: target.type,
        cancel: () => controller.abort()
      }
    ]);
    try {
      // The server writes the upload through its single job slot, so the
      // progress comes from the media job the page polls, not from here: a
      // request that reports its own bytes would still need the server to
      // accept them.
      const rsp = await api.uploadMediaFile(target.type, target.rel, dir, file, controller.signal);
      if (rsp.code === 0) {
        if (refreshAfter) {
          if (isBrowsed(target) && dir === path) {
            await refreshRef.current();
          } else {
            onMediaChanged();
          }
        }
        return true;
      }
      if (rsp.code === api.codeAlreadyExists) {
        onError(t('storage.files.exists', { name: file.name }));
        onNameTaken(file.name);
        return true;
      }
      onError(rsp.msg);
      return true;
    } catch {
      // A cancelled upload is what the user asked for, not a failure.
      if (controller.signal.aborted) return false;
      onError(t('storage.files.uploadFailed'));
      return true;
    } finally {
      uploadControllers.current.delete(controller);
      setUploads((current) => current.filter((item) => item.id !== id));
    }
  }

  // A pick or a drop can carry several files, and a folder carries a tree of
  // them. The folders are created first, shallowest first, because a file
  // cannot land in a folder that does not exist yet. The files then go one
  // request at a time: the medium job slot is single, so a burst of parallel
  // uploads would only queue on the server anyway.
  async function uploadEntries(
    target: api.MediaItem,
    baseDir: string,
    entries: { path: string; file: File }[],
    explicitDirectories: string[] = []
  ) {
    const directories = [
      ...new Set([
        ...explicitDirectories,
        ...entries.flatMap((entry) => parentDirectories(entry.path))
      ])
    ].sort((a, b) => a.split('/').length - b.split('/').length);

    for (const directory of directories) {
      try {
        // existsOk: a tree may already be partly there, and stopping at the
        // first existing folder would copy nothing at all.
        const rsp = await api.mkdirMediaFile({
          type: target.type,
          rel: target.rel,
          path: joinPath(baseDir, directory),
          existsOk: true
        });
        if (rsp.code !== 0) {
          onError(rsp.msg);
          return;
        }
      } catch {
        onError(t('storage.failed'));
        return;
      }
    }

    for (const entry of entries) {
      const uploaded = await uploadOne(
        target,
        joinPath(baseDir, dirnameOf(entry.path)),
        entry.file,
        false
      );
      if (!uploaded) break;
    }

    await refreshRef.current();
  }

  function pickFiles() {
    if (!media) return;
    uploadTarget.current = { target: media, dir: path };
    inputRef.current?.click();
  }

  function pickFolder() {
    if (!media) return;
    uploadTarget.current = { target: media, dir: path };
    folderInputRef.current?.click();
  }

  function openNewFolder() {
    // The folder is created in the directory open right now: the modal may
    // still be up while the user navigates, so the target is remembered.
    mkdirTarget.current = path;
    setFolderName('');
    setIsMkdirOpen(true);
  }

  async function createFolder() {
    const name = folderName.trim();
    if (!name || !media || isMkdirBusy) return;

    setIsMkdirBusy(true);
    try {
      const rsp = await api.mkdirMediaFile({
        type: media.type,
        rel: media.rel,
        path: childPath(mkdirTarget.current, name)
      });
      if (rsp.code !== 0) {
        onError(rsp.code === api.codeAlreadyExists ? t('storage.files.exists', { name }) : rsp.msg);
        return;
      }
      setIsMkdirOpen(false);
      setFolderName('');
      await refreshRef.current();
    } catch {
      onError(t('storage.failed'));
    } finally {
      setIsMkdirBusy(false);
    }
  }

  async function onDropFiles(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    if (!canWrite || !media || !event.dataTransfer) return;

    // The transfer's items are only readable while the event is being handled,
    // so every entry is taken here; walking them (and their folders) happens
    // after this function has already awaited something.
    let dropped: Awaited<ReturnType<typeof collectDroppedEntries>>;
    try {
      dropped = await collectDroppedEntries(event.dataTransfer);
    } catch {
      // A folder can be unreadable (a protected directory, or a drop source
      // that hands over an entry the browser cannot open). Say so once rather
      // than leaving the drop silently ignored.
      onError(t('storage.files.uploadFailed'));
      return;
    }

    if (dropped.entries.length === 0 && dropped.directories.length === 0) return;
    await uploadEntries(media, path, dropped.entries, dropped.directories);
  }

  function confirmDelete(entry: api.MediaFileEntry, target: string) {
    if (!media) return;

    modal.confirm({
      // A folder goes with everything it holds, so its confirm says so; the
      // file confirm stays the plain question.
      title: entry.isDir ? t('storage.files.deleteFolderTitle') : t('storage.files.deleteTitle'),
      content: entry.isDir
        ? t('storage.files.deleteFolderConfirm', { name: entry.name })
        : t('storage.files.deleteConfirm', { name: entry.name }),
      okText: t('storage.yes'),
      cancelText: t('storage.no'),
      okButtonProps: { danger: true },
      onOk: async () => {
        let rsp;
        try {
          rsp = await api.deleteMediaFile({
            type: media.type,
            rel: media.rel,
            path: target
          });
        } catch {
          onError(t('storage.failed'));
          return;
        }
        if (rsp.code !== 0) {
          onError(rsp.msg);
          return;
        }
        expandedGeneration.current += 1;
        setExpandedDirs({});
        setExpandingDirs({});
        await refreshRef.current();
      }
    });
  }

  const overlays = (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          const pending = uploadTarget.current;
          uploadTarget.current = null;
          const list = Array.from(event.target.files ?? []);
          if (inputRef.current) inputRef.current.value = '';
          if (!pending || list.length === 0) return;
          void uploadEntries(
            pending.target,
            pending.dir,
            list.map((file) => ({ path: relativePathOf(file), file }))
          );
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          const pending = uploadTarget.current;
          uploadTarget.current = null;
          const list = Array.from(event.target.files ?? []);
          if (folderInputRef.current) folderInputRef.current.value = '';
          if (!pending || list.length === 0) return;
          void uploadEntries(
            pending.target,
            pending.dir,
            list.map((file) => ({ path: relativePathOf(file), file }))
          );
        }}
      />
      <Modal
        title={t('storage.files.newFolder')}
        open={isMkdirOpen}
        okText={t('storage.files.create')}
        cancelText={t('storage.no')}
        okButtonProps={{ disabled: !folderName.trim(), loading: isMkdirBusy }}
        onOk={() => void createFolder()}
        onCancel={() => setIsMkdirOpen(false)}
      >
        <Input
          autoFocus
          placeholder={t('storage.files.newFolderPlaceholder')}
          value={folderName}
          maxLength={255}
          onChange={(event) => setFolderName(event.target.value)}
          onPressEnter={() => void createFolder()}
        />
      </Modal>
    </>
  );

  const crumbs = media ? path.split('/').filter(Boolean) : [];

  // The toolbar is where the panel's two actions - upload and refresh - live,
  // so they are labelled buttons rather than bare icons: upload is the reason
  // the page exists and refresh answers "did the copy arrive" every time the
  // target machine wrote onto the disk.
  // Only invoked while a browsable medium is up: it dereferences media.
  function renderToolbar() {
    return (
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 rounded-lg border border-solid border-neutral-700/70 bg-white/[0.03] px-1.5 py-1">
          <Tooltip title={t('storage.files.up')}>
            <Button
              type="text"
              size="small"
              disabled={path === '/'}
              icon={<CornerLeftUpIcon size={14} />}
              onClick={openParent}
            />
          </Tooltip>
          <Breadcrumb
            className="min-w-0"
            items={[
              {
                title: media!.type === 'partition' ? t('storage.typePartition') : media!.name,
                className: 'cursor-pointer',
                onClick: () => onPathChange('/')
              },
              ...crumbs.map((crumb, index) => ({
                title: crumb,
                className: 'cursor-pointer',
                onClick: () => onPathChange(`/${crumbs.slice(0, index + 1).join('/')}`)
              }))
            ]}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Segmented<ViewMode>
            size="small"
            value={viewMode}
            onChange={(value) => setViewMode(value)}
            options={[
              {
                value: 'list',
                label: (
                  <Tooltip title={t('storage.files.view.list')}>
                    <span className="flex size-5 items-center justify-center leading-none">
                      <ListIcon size={14} aria-hidden="true" />
                    </span>
                  </Tooltip>
                )
              },
              {
                value: 'grid',
                label: (
                  <Tooltip title={t('storage.files.view.grid')}>
                    <span className="flex size-5 items-center justify-center leading-none">
                      <LayoutGridIcon size={14} aria-hidden="true" />
                    </span>
                  </Tooltip>
                )
              }
            ]}
          />
          <Tooltip title={canWrite ? t('storage.files.newFolder') : t('storage.add.blocked')}>
            <Button
              size="small"
              icon={<FolderPlusIcon size={14} />}
              disabled={!canWrite}
              onClick={openNewFolder}
            />
          </Tooltip>
          <Button
            size="small"
            icon={<RefreshCwIcon size={14} className={isLoading ? 'animate-spin' : ''} />}
            onClick={() => (isBrowsed(media!) ? void refresh() : onMediaChanged())}
          >
            {t('storage.refresh')}
          </Button>
          <Tooltip title={canWrite ? t('storage.files.uploadFolder') : t('storage.add.blocked')}>
            <Button
              size="small"
              icon={<FolderUpIcon size={14} />}
              disabled={!canWrite}
              loading={uploads.some((item) => item.targetType === media!.type)}
              onClick={pickFolder}
            />
          </Tooltip>
          <Tooltip title={canWrite ? '' : t('storage.add.blocked')}>
            <Button
              size="small"
              type="primary"
              icon={<UploadIcon size={14} />}
              disabled={!canWrite}
              loading={uploads.some((item) => item.targetType === media!.type)}
              onClick={pickFiles}
            >
              {t('storage.files.uploadButton')}
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  }

  const searchRow = (
    <div className="flex items-center gap-1.5 pb-3">
      <Input
        size="small"
        allowClear
        prefix={<SearchIcon size={13} className="text-neutral-400" />}
        placeholder={t('storage.files.search')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-w-0 flex-1"
      />
      <Select
        size="small"
        value={sortKey}
        onChange={(value) => setSortKey(value as SortKey)}
        options={[
          { value: 'name', label: t('storage.files.sort.name') },
          { value: 'size', label: t('storage.files.sort.size') },
          { value: 'type', label: t('storage.files.sort.type') },
          { value: 'modified', label: t('storage.files.sort.modified') }
        ]}
        style={{ width: 116 }}
      />
      <Tooltip title={sortAsc ? t('storage.files.sort.asc') : t('storage.files.sort.desc')}>
        <Button
          size="small"
          icon={sortAsc ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />}
          onClick={() => setSortAsc(!sortAsc)}
        />
      </Tooltip>
    </div>
  );

  function renderSize(entry: api.MediaFileEntry, writing: boolean | undefined): ReactNode {
    if (entry.isDir) return null;
    return isWritingEntry(entry, writing) ? (
      <span className="text-blue-300">{t('storage.files.uploading')}</span>
    ) : (
      formatSize(entry.size)
    );
  }

  // The list view lays its cells on the same grid the header uses, so the
  // columns line up at any width. The modified column leaves on narrow
  // screens, where size and the row actions matter more.
  const listColumns =
    'grid-cols-[minmax(0,1fr)_84px_68px] sm:grid-cols-[minmax(0,1fr)_150px_88px_76px]';

  function renderSortLabel(key: SortKey, label: string, className?: string) {
    const active = sortKey === key;
    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className={clsx(
          'font-inherit flex appearance-none items-center gap-1 border-0 bg-transparent p-0 text-left uppercase tracking-wide transition-colors hover:text-neutral-200',
          active ? 'text-neutral-200' : 'text-neutral-500',
          className
        )}
      >
        {label}
        {active && (sortAsc ? <ArrowUpIcon size={11} /> : <ArrowDownIcon size={11} />)}
      </button>
    );
  }

  const listHeader = (
    <div
      className={clsx(
        'grid shrink-0 items-center gap-3 overflow-hidden rounded-lg border border-solid border-neutral-700/80 px-2 py-2 text-[11px] font-medium [scrollbar-gutter:stable]',
        listColumns
      )}
      style={{ backgroundColor: 'rgba(24, 24, 27, 0.96)' }}
    >
      <div className="pl-1">{renderSortLabel('name', t('storage.files.sort.name'))}</div>
      <div className="hidden sm:block">
        {renderSortLabel('modified', t('storage.files.sort.modified'))}
      </div>
      <div className="flex justify-end">
        {renderSortLabel('size', t('storage.files.sort.size'))}
      </div>
      <div />
    </div>
  );

  function renderEntryRows(
    rows: api.MediaFileEntry[],
    parentPath: string,
    depth: number,
    writing: boolean | undefined
  ): ReactNode {
    return rows.map((entry) => {
      const fullPath = childPath(parentPath, entry.name);
      const expanded = entry.isDir ? expandedDirs[fullPath] : undefined;
      const childEntries = expanded ? sortEntries(expanded.entries, sortKey, sortAsc) : [];

      return (
        <Fragment key={fullPath}>
          <div
            className={clsx(
              'group grid items-center gap-3 px-2 py-1.5 text-sm hover:bg-white/[0.05]',
              listColumns
            )}
          >
            <div
              className={clsx(
                'flex min-w-0 items-center space-x-1.5',
                entry.isDir && 'cursor-pointer'
              )}
              style={{ paddingLeft: depth * 18 }}
              onClick={() => entry.isDir && openDir(fullPath)}
            >
              {entry.isDir ? (
                <>
                  <Button
                    type="text"
                    size="small"
                    className="flex h-6 w-6 shrink-0 items-center justify-center"
                    icon={
                      expandingDirs[fullPath] ? (
                        <LoaderCircleIcon size={14} className="animate-spin" />
                      ) : expanded ? (
                        <ChevronDownIcon size={14} />
                      ) : (
                        <ChevronRightIcon size={14} />
                      )
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      void toggleDir(fullPath);
                    }}
                  />
                  <FolderIcon size={16} className="shrink-0 text-blue-300" />
                </>
              ) : (
                <>
                  <span className="h-6 w-6 shrink-0" />
                  <FileTypeIcon name={entry.name} size={16} />
                </>
              )}
              <span className="truncate text-neutral-100" title={entry.name}>
                {entry.name}
              </span>
            </div>

            <span
              className="hidden truncate text-xs text-neutral-500 sm:block"
              title={formatModified(entry.modifiedAt)}
            >
              {formatModified(entry.modifiedAt)}
            </span>

            <span className="text-right text-xs text-neutral-400">
              {renderSize(entry, writing)}
            </span>

            <div className="flex items-center justify-end space-x-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
              {!entry.isDir && (
                <Button
                  type="text"
                  size="small"
                  href={api.mediaFileDownloadUrl(media!.type, media!.rel, fullPath)}
                  download
                  icon={<DownloadIcon size={14} />}
                  title={t('storage.files.download')}
                />
              )}
              <Button
                type="text"
                size="small"
                danger={canWrite}
                disabled={!canWrite}
                icon={<Trash2Icon size={14} />}
                title={canWrite ? t('storage.files.delete') : t('storage.add.blocked')}
                onClick={() => canWrite && confirmDelete(entry, fullPath)}
              />
            </div>
          </div>

          {expandingDirs[fullPath] && (
            <div
              className="flex items-center px-3 py-2 text-neutral-400"
              style={{ paddingLeft: 44 + depth * 18 }}
            >
              <LoaderCircleIcon size={14} className="animate-spin" />
            </div>
          )}
          {expanded && childEntries.length === 0 && (
            <div
              className="px-3 py-2 text-sm text-neutral-400"
              style={{ paddingLeft: 44 + depth * 18 }}
            >
              {t('storage.files.empty')}
            </div>
          )}
          {expanded && renderEntryRows(childEntries, fullPath, depth + 1, expanded.writing)}
        </Fragment>
      );
    });
  }

  // The main link and corner actions are siblings so each download keeps its
  // default browser behavior and deleting never follows the main link.
  function renderGrid() {
    return (
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-1">
          {visibleEntries.map((entry) => {
            const fullPath = childPath(path, entry.name);
            const writing = isWritingEntry(entry, files?.writing);

            const cardBody = (
              <>
                <div className="flex h-12 items-center justify-center">
                  {entry.isDir ? (
                    <FolderIcon
                      size={42}
                      strokeWidth={1.3}
                      className="text-blue-300"
                      fill="rgba(147,197,253,0.16)"
                    />
                  ) : (
                    <FileTypeIcon name={entry.name} size={38} />
                  )}
                </div>
                <span
                  className="line-clamp-2 w-full break-all text-xs leading-4 text-neutral-200"
                  title={entry.name}
                >
                  {entry.name}
                </span>
                <span className="text-[11px] leading-3 text-neutral-500">
                  {entry.isDir
                    ? t('storage.files.folder')
                    : writing
                      ? t('storage.files.uploading')
                      : formatSize(entry.size)}
                </span>
              </>
            );

            const actions = (
              <div
                className="absolute right-1 top-1 flex space-x-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
                onClick={(event) => event.stopPropagation()}
              >
                {!entry.isDir && (
                  <Button
                    type="text"
                    size="small"
                    href={api.mediaFileDownloadUrl(media!.type, media!.rel, fullPath)}
                    download
                    icon={<DownloadIcon size={13} />}
                    title={t('storage.files.download')}
                  />
                )}
                <Button
                  type="text"
                  size="small"
                  danger={canWrite}
                  disabled={!canWrite}
                  icon={<Trash2Icon size={13} />}
                  title={canWrite ? t('storage.files.delete') : t('storage.add.blocked')}
                  onClick={() => canWrite && confirmDelete(entry, fullPath)}
                />
              </div>
            );

            const cardClass =
              'group relative flex cursor-pointer flex-col items-center gap-1 rounded-xl px-2 pb-2.5 pt-3 text-center transition-colors hover:bg-white/[0.07] focus-visible:bg-white/[0.07] focus-visible:outline-none';

            return entry.isDir ? (
              <div
                key={fullPath}
                role="button"
                tabIndex={0}
                className={cardClass}
                onClick={() => openDir(fullPath)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') openDir(fullPath);
                }}
              >
                {cardBody}
                {actions}
              </div>
            ) : (
              <div
                key={fullPath}
                className="group relative rounded-xl focus-within:bg-white/[0.07] hover:bg-white/[0.07]"
              >
                <a
                  href={api.mediaFileDownloadUrl(media!.type, media!.rel, fullPath)}
                  download
                  className={cardClass}
                >
                  {cardBody}
                </a>
                {actions}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const emptyBox = (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-neutral-500">
        {query.trim() ? <SearchIcon size={24} /> : <FolderIcon size={24} />}
      </div>
      <span className="text-sm text-neutral-300">
        {query.trim() ? t('storage.files.noMatch') : t('storage.files.empty')}
      </span>
      {canWrite && !query.trim() && (
        <span className="text-xs text-neutral-500">{t('storage.files.dropHint')}</span>
      )}
    </div>
  );

  const body = (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-solid border-neutral-700/80 bg-white/[0.02]"
      onDragOver={(event) => {
        if (!canWrite) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setIsDragging(false);
        }
      }}
      onDrop={(event) => void onDropFiles(event)}
    >
      {!media || !canBrowse ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-neutral-500">
            <CircleAlertIcon size={24} />
          </div>
          <span className="text-sm text-neutral-200">{t('storage.files.selectMedium')}</span>
        </div>
      ) : isLoading && !files ? (
        <div className="flex min-h-0 flex-1 items-center justify-center text-neutral-400">
          <LoaderCircleIcon size={18} className="animate-spin" />
        </div>
      ) : visibleEntries.length === 0 ? (
        emptyBox
      ) : viewMode === 'list' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-1">
          {listHeader}
          <div className="min-h-0 flex-1 overflow-auto pt-1 [scrollbar-gutter:stable]">
            {path !== '/' && (
              <div
                className={clsx(
                  'grid cursor-pointer items-center gap-3 border-b border-solid border-neutral-800 px-2 py-1.5 text-sm text-neutral-300 hover:bg-white/[0.05]',
                  listColumns
                )}
                onClick={openParent}
              >
                <div className="flex min-w-0 items-center space-x-1.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <CornerLeftUpIcon size={14} className="text-neutral-400" />
                  </span>
                  <span>..</span>
                </div>
              </div>
            )}
            <div className="divide-y divide-neutral-800">
              {renderEntryRows(visibleEntries, path, 0, files?.writing)}
            </div>
          </div>
        </div>
      ) : (
        renderGrid()
      )}

      {isDragging && canWrite && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-blue-500/10 text-blue-300 ring-2 ring-inset ring-blue-400/60">
          <UploadIcon size={26} />
          <span className="text-sm">{t('storage.files.dropHint')}</span>
        </div>
      )}
    </div>
  );

  const statusBar = files && canBrowse && (
    <div className="flex items-center justify-between pt-2.5 text-xs text-neutral-500">
      <span>{t('storage.files.itemCount', { count: visibleEntries.length })}</span>
      <span>{t('storage.files.free', { size: formatSize(files.free) })}</span>
    </div>
  );

  const content = (
    <div className="flex h-full min-h-0 flex-col">
      {media && canBrowse && (
        <>
          {renderToolbar()}
          {searchRow}
        </>
      )}
      {body}
      {statusBar}
    </div>
  );

  return {
    content,
    overlays,
    uploads: uploads.map(({ id, name, cancel }) => ({ id, name, cancel }))
  };
}

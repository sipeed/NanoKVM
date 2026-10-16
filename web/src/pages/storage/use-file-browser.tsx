import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { App, Breadcrumb, Button, Empty, Input, Select, Tooltip } from 'antd';
import clsx from 'clsx';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  DownloadIcon,
  FolderIcon,
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

type Reason = 'attached' | 'notBrowsable' | 'isoImage' | 'noLoop' | '';

type SortKey = 'name' | 'size' | 'type';

type Props = {
  // The medium whose files the panel is showing; null when nothing is
  // selected.
  media: api.MediaItem | null;
  // The shared-files medium. Its group title hosts a toolbar that always
  // targets it, whether or not it is the medium being browsed.
  share: api.MediaItem | null;
  reason: Reason;
  // True while the target machine is holding the data partition. Every medium
  // lives on it, so nothing here may be written then - the files inside an
  // image included - which is the same state the image group gates its upload
  // buttons on.
  dataOwned: boolean;
  path: string;
  onPathChange: (path: string) => void;
  // Incremented by the page on every storage push event: the target machine
  // wrote to the shared files, so the listing re-reads.
  changeSignal: number;
  // Fired when a transfer touched a medium the panel is not browsing, so the
  // page can refresh its medium list.
  onMediaChanged: () => void;
  onError: (message: string) => void;
};

function isImageName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.iso') || lower.endsWith('.img');
}

// The names a running transfer gives its temporaries (the server-side
// diskfs.UploadPrefix and the image transfer prefix). They are the only
// dot-prefixed names hidden: anything else starting with a dot is the user's
// own file, and hiding it makes the browser lie about a folder.
const transferTempPrefixes = ['.kvm-upload-', '.nanokvm-'];

function childPath(parent: string, name: string): string {
  return parent === '/' ? `/${name}` : `${parent}/${name}`;
}

// A browser upload in flight. The page shows it next to the media job that
// reports its progress, with a button that aborts the request.
export type FileUpload = {
  id: number;
  name: string;
  cancel: () => void;
};

function sortEntries(entries: api.MediaFileEntry[], sortKey: SortKey, sortAsc: boolean) {
  return [...entries].sort((a, b) => {
    // Folders stay ahead of files; the chosen key sorts inside each group.
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;

    let compared: number;
    if (sortKey === 'size') {
      compared = a.size - b.size;
    } else if (sortKey === 'type') {
      compared = extension(a.name).localeCompare(extension(b.name));
    } else {
      compared = a.name.localeCompare(b.name);
    }
    if (compared === 0) compared = a.name.localeCompare(b.name);
    return sortAsc ? compared : -compared;
  });
}

// The share group's toolbar is returned on its own so the page can pin it to
// the group's title row, mirroring the image group's buttons. Its buttons
// always target the shared files, whether or not they are the medium being
// browsed, so browsing an image does not take the share's refresh away. An
// upload is refused while the target machine is holding the partition, exactly
// like the image group's upload button: both write onto one filesystem that
// both sides cache, so the page disables the one it knows will fail instead of
// letting the server answer with an error. Browsing an image adds a second
// toolbar to the panel header, targeting the image. The hidden input goes
// through overlays, where it cannot disturb the layout.
export function useFileBrowser({
  media,
  share,
  reason,
  dataOwned,
  path,
  onPathChange,
  changeSignal,
  onMediaChanged,
  onError
}: Props) {
  const { t } = useTranslation();
  const { modal } = App.useApp();

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
  const [expandingDirs, setExpandingDirs] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<{ target: api.MediaItem; dir: string } | null>(null);

  const canBrowse = !!media && reason === '';

  // Every medium lives on the data partition, so the target machine holding it
  // blocks writing anywhere from here, not just into the medium on screen.
  const canWrite = !dataOwned;

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

  // Every listing carries a number: an answer that arrives after a newer
  // request belongs to a folder the user has already left.
  const listingId = useRef(0);
  const expandedGeneration = useRef(0);

  const refresh = useCallback(async () => {
    // Leaving for a medium that cannot be browsed still has to outdate a
    // listing in flight for the previous one.
    const id = ++listingId.current;
    if (!mediaType || !canBrowse) {
      setListing(null);
      setIsLoading(false);
      return;
    }

    const key = `${mediaType}:${mediaRel ?? ''}:${path}`;
    setIsLoading(true);
    try {
      const rsp = await api.listMediaFiles({ type: mediaType, rel: mediaRel ?? '', path });
      if (id !== listingId.current) return;
      if (rsp.code === 0) {
        setListing({ key, files: rsp.data });
      } else {
        onError(rsp.msg);
      }
    } catch {
      if (id === listingId.current) onError(t('storage.failed'));
    } finally {
      if (id === listingId.current) setIsLoading(false);
    }
  }, [mediaType, mediaRel, path, canBrowse, onError, t]);

  // An upload or a delete finishes long after the render that started it, so
  // those continuations refresh through this ref: they must re-read what the
  // user is looking at now, not the folder they were looking at before.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh, changeSignal]);

  // Searching filters the folder being shown; carrying the text into another
  // folder would mostly produce empty-looking listings.
  useEffect(() => {
    setQuery('');
  }, [mediaType, mediaRel, path]);

  // Expanded directories belong to the folder and medium that loaded them.
  // A storage notification also invalidates them because the target machine
  // may have changed their contents.
  useEffect(() => {
    expandedGeneration.current += 1;
    setExpandedDirs({});
    setExpandingDirs({});
  }, [mediaType, mediaRel, path, changeSignal]);

  // On the emulated volume, the images are shown in the image list instead:
  // this browser is for the files being exchanged.
  function isEntryVisible(entry: api.MediaFileEntry): boolean {
    if (transferTempPrefixes.some((prefix) => entry.name.startsWith(prefix))) return false;
    return !(media?.type === 'partition' && !entry.isDir && isImageName(entry.name));
  }

  const entries = (files?.entries ?? []).filter(isEntryVisible);

  const trimmedQuery = query.trim().toLowerCase();
  const visibleEntries = sortEntries(
    trimmedQuery
      ? entries.filter((entry) => entry.name.toLowerCase().includes(trimmedQuery))
      : entries,
    sortKey,
    sortAsc
  );

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
        path: directoryPath
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

  async function upload(file: File | null) {
    const pending = uploadTarget.current;
    uploadTarget.current = null;
    if (!file || !pending) return;

    if (inputRef.current) inputRef.current.value = '';

    const { target, dir } = pending;
    const id = ++uploadId.current;
    const controller = new AbortController();
    setUploads((current) => [
      ...current,
      { id, name: file.name, targetType: target.type, cancel: () => controller.abort() }
    ]);
    try {
      const rsp = await api.uploadMediaFile(target.type, target.rel, dir, file, controller.signal);
      if (rsp.code === 0) {
        if (isBrowsed(target) && dir === path) {
          await refreshRef.current();
        } else {
          onMediaChanged();
        }
      } else {
        onError(rsp.msg);
      }
    } catch {
      // A cancelled upload is what the user asked for, not a failure.
      if (!controller.signal.aborted) onError(t('storage.files.uploadFailed'));
    } finally {
      setUploads((current) => current.filter((item) => item.id !== id));
    }
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
          rsp = await api.deleteMediaFile({ type: media.type, rel: media.rel, path: target });
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

  function renderToolbar(target: api.MediaItem | null, dir: string) {
    if (!target) return null;

    return (
      <div className="flex shrink-0 items-center space-x-1">
        <Tooltip title={canWrite ? t('storage.files.upload') : t('storage.add.blocked')}>
          <Button
            size="small"
            icon={<UploadIcon size={14} />}
            disabled={!canWrite}
            loading={uploads.some((item) => item.targetType === target.type)}
            onClick={() => {
              uploadTarget.current = { target, dir };
              inputRef.current?.click();
            }}
          />
        </Tooltip>
        <Tooltip title={t('storage.refresh')}>
          <Button
            size="small"
            icon={<RefreshCwIcon size={14} />}
            onClick={() => (isBrowsed(target) ? void refresh() : onMediaChanged())}
          />
        </Tooltip>
      </div>
    );
  }

  // The share toolbar uploads into the folder being browsed while the shared
  // files are on screen, and into their root otherwise.
  const shareBrowsed = !!share && isBrowsed(share);
  const shareToolbar = renderToolbar(share, shareBrowsed ? path : '/');

  const overlays = (
    <input
      ref={inputRef}
      type="file"
      className="hidden"
      onChange={(event) => void upload(event.target.files?.[0] ?? null)}
    />
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
      const childEntries = expanded
        ? sortEntries(expanded.entries.filter(isEntryVisible), sortKey, sortAsc)
        : [];

      return (
        <Fragment key={fullPath}>
          <div
            className="group flex items-center justify-between px-3 py-2 text-sm hover:bg-neutral-800/60"
            style={{ paddingLeft: 12 + depth * 16 }}
          >
            <div
              className={clsx(
                'flex min-w-0 flex-1 items-center space-x-2',
                entry.isDir && 'cursor-pointer'
              )}
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
                  <FolderIcon size={14} className="shrink-0 text-neutral-400" />
                </>
              ) : (
                <>
                  <span className="h-6 w-6 shrink-0" />
                  <FileTypeIcon name={entry.name} />
                </>
              )}
              <span
                className={clsx('truncate', entry.isDir ? 'text-neutral-200' : 'text-neutral-300')}
                title={entry.name}
              >
                {entry.name}
              </span>
            </div>

            <div className="flex shrink-0 items-center space-x-3">
              <span className="text-xs text-neutral-500">
                {entry.isDir ? (
                  ''
                ) : entry.size === 0 && writing ? (
                  <span className="text-blue-500">{t('storage.files.uploading')}</span>
                ) : (
                  formatSize(entry.size)
                )}
              </span>
              <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
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
          </div>

          {expandingDirs[fullPath] && (
            <div
              className="flex items-center px-3 py-2 text-neutral-500"
              style={{ paddingLeft: 40 + depth * 16 }}
            >
              <LoaderCircleIcon size={14} className="animate-spin" />
            </div>
          )}
          {expanded && childEntries.length === 0 && (
            <div
              className="px-3 py-2 text-sm text-neutral-500"
              style={{ paddingLeft: 40 + depth * 16 }}
            >
              {t('storage.files.empty')}
            </div>
          )}
          {expanded && renderEntryRows(childEntries, fullPath, depth + 1, expanded.writing)}
        </Fragment>
      );
    });
  }

  const body =
    !media || !canBrowse ? (
      <div className="flex flex-1 items-center justify-center px-8">
        <Empty
          image={<CircleAlertIcon size={28} className="text-neutral-600" />}
          description={
            <div className="flex flex-col space-y-2">
              <span className="text-neutral-400">
                {reason === 'attached' && t('storage.files.reasonAttached')}
                {reason === 'notBrowsable' && t('storage.files.reasonNotBrowsable')}
                {reason === 'isoImage' && t('storage.files.reasonISOImage')}
                {reason === 'noLoop' && t('storage.files.reasonNoLoop')}
                {reason === '' && t('storage.files.selectMedium')}
              </span>
              {reason === 'attached' && (
                <span className="text-sm text-neutral-500">
                  {t('storage.files.reasonAttachedHint')}
                </span>
              )}
            </div>
          }
        />
      </div>
    ) : (
      <div className="min-h-0 flex-1 overflow-auto rounded border border-neutral-800">
        {isLoading && !files ? (
          <div className="flex h-full items-center justify-center text-neutral-500">
            <LoaderCircleIcon size={18} className="animate-spin" />
          </div>
        ) : visibleEntries.length === 0 && path === '/' ? (
          <div className="flex h-full items-center justify-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                entries.length > 0 ? t('storage.files.noMatch') : t('storage.files.empty')
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60">
            {path !== '/' && (
              <div
                className="flex cursor-pointer items-center space-x-2 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800/60"
                onClick={openParent}
              >
                <FolderIcon size={14} />
                <span>..</span>
              </div>
            )}
            {renderEntryRows(visibleEntries, path, 0, files?.writing)}
            {visibleEntries.length === 0 && (
              <div className="px-3 py-3 text-center text-sm text-neutral-500">
                {t('storage.files.noMatch')}
              </div>
            )}
          </div>
        )}
      </div>
    );

  const crumbs = media ? path.split('/').filter(Boolean) : [];

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-3">
        <div className="flex min-w-0 items-center text-sm">
          {media && canBrowse && (
            <Breadcrumb
              items={[
                {
                  title: media.type === 'partition' ? t('storage.typePartition') : media.name,
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
          )}
        </div>

        <div className="flex items-center space-x-2">
          {canBrowse && files && (
            <span className="text-xs text-neutral-500">
              {t('storage.files.free', { size: formatSize(files.free) })}
            </span>
          )}
          {media && canBrowse && media.type !== 'partition' && renderToolbar(media, path)}
        </div>
      </div>

      {media && canBrowse && (
        <div className="flex items-center space-x-2 pb-2">
          <Input
            size="small"
            allowClear
            prefix={<SearchIcon size={13} className="text-neutral-500" />}
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
              { value: 'type', label: t('storage.files.sort.type') }
            ]}
            style={{ width: 100 }}
          />
          <Tooltip title={sortAsc ? t('storage.files.sort.asc') : t('storage.files.sort.desc')}>
            <Button
              size="small"
              icon={sortAsc ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />}
              onClick={() => setSortAsc(!sortAsc)}
            />
          </Tooltip>
        </div>
      )}

      {body}
    </div>
  );

  return {
    toolbar: shareToolbar,
    content,
    overlays,
    uploads: uploads.map(({ id, name, cancel }) => ({ id, name, cancel }))
  };
}

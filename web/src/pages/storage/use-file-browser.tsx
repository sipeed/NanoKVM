import { useCallback, useEffect, useRef, useState } from 'react';
import { Breadcrumb, Button, Empty, Input, Modal, Select, Tooltip } from 'antd';
import clsx from 'clsx';
import {
  ArrowDownIcon,
  ArrowUpIcon,
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

  const [files, setFiles] = useState<api.MediaFiles | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [busy, setBusy] = useState('');
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

  const refresh = useCallback(async () => {
    if (!media || !canBrowse) {
      setFiles(null);
      return;
    }

    setIsLoading(true);
    try {
      const rsp = await api.listMediaFiles({ type: media.type, rel: media.rel, path });
      if (rsp.code === 0) {
        setFiles(rsp.data);
      } else {
        onError(rsp.msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [media, path, canBrowse, onError]);

  useEffect(() => {
    void refresh();
  }, [refresh, changeSignal]);

  // Searching filters the folder being shown; carrying the text into another
  // folder would mostly produce empty-looking listings.
  useEffect(() => {
    setQuery('');
  }, [media, path]);

  // On the emulated volume, the images are shown in the image list instead:
  // this browser is for the files being exchanged. Names starting with a dot
  // are this device's own temporary files.
  const entries = (files?.entries ?? []).filter((entry) => {
    if (entry.name.startsWith('.')) return false;
    return !(media?.type === 'partition' && !entry.isDir && isImageName(entry.name));
  });

  const trimmedQuery = query.trim().toLowerCase();
  const visibleEntries = [
    ...(trimmedQuery
      ? entries.filter((entry) => entry.name.toLowerCase().includes(trimmedQuery))
      : entries)
  ].sort((a, b) => {
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

  function openDir(name: string) {
    onPathChange(path === '/' ? `/${name}` : `${path}/${name}`);
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

    const { target, dir } = pending;
    setBusy(`upload:${target.type}`);
    try {
      const rsp = await api.uploadMediaFile(target.type, target.rel, dir, file);
      if (rsp.code === 0) {
        if (isBrowsed(target)) {
          await refresh();
        } else {
          onMediaChanged();
        }
      } else {
        onError(rsp.msg);
      }
    } catch {
      onError(t('storage.files.uploadFailed'));
    } finally {
      setBusy('');
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function confirmDelete(entry: api.MediaFileEntry) {
    if (!media) return;

    Modal.confirm({
      title: t('storage.files.deleteTitle'),
      content: t('storage.files.deleteConfirm', { name: entry.name }),
      okText: t('storage.yes'),
      cancelText: t('storage.no'),
      okButtonProps: { danger: true },
      onOk: async () => {
        const target = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;
        const rsp = await api.deleteMediaFile({ type: media.type, rel: media.rel, path: target });
        if (rsp.code !== 0) {
          onError(rsp.msg);
          return;
        }
        await refresh();
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
            loading={busy === `upload:${target.type}`}
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
            {visibleEntries.map((entry) => (
              <div
                key={entry.name}
                className="group flex items-center justify-between px-3 py-2 text-sm hover:bg-neutral-800/60"
              >
                <div
                  className={clsx(
                    'flex min-w-0 flex-1 items-center space-x-2',
                    entry.isDir && 'cursor-pointer'
                  )}
                  onClick={() => entry.isDir && openDir(entry.name)}
                >
                  {entry.isDir ? (
                    <FolderIcon size={14} className="shrink-0 text-neutral-400" />
                  ) : (
                    <FileTypeIcon name={entry.name} />
                  )}
                  <span
                    className={clsx(
                      'truncate',
                      entry.isDir ? 'text-neutral-200' : 'text-neutral-300'
                    )}
                    title={entry.name}
                  >
                    {entry.name}
                  </span>
                </div>

                <div className="flex shrink-0 items-center space-x-3">
                  <span className="text-xs text-neutral-500">
                    {entry.isDir ? (
                      ''
                    ) : entry.size === 0 && files?.writing ? (
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
                        href={api.mediaFileDownloadUrl(
                          media.type,
                          media.rel,
                          path === '/' ? `/${entry.name}` : `${path}/${entry.name}`
                        )}
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
                      onClick={() => canWrite && confirmDelete(entry)}
                    />
                  </div>
                </div>
              </div>
            ))}
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

  return { toolbar: shareToolbar, content, overlays };
}

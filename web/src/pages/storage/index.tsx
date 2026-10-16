import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, App, Button, Modal, notification, Segmented, Tooltip } from 'antd';
import clsx from 'clsx';
import {
  DiscIcon,
  DownloadIcon,
  HardDriveIcon,
  LoaderCircleIcon,
  PlugIcon,
  Trash2Icon,
  UnplugIcon,
  XIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/media.ts';
import { formatSize } from '@/lib/format.ts';
import { MediaIcon } from '@/lib/media-icons.tsx';
import { WsClient } from '@/lib/websocket.ts';
import { useMediaMount } from '@/hooks/useMediaMount.ts';
import { Head } from '@/components/head.tsx';

import { useAddMedia } from './use-add-media.tsx';
import { useFileBrowser } from './use-file-browser.tsx';

const statePollInterval = 5000;

// A titled block in the medium list: the emulated disk is one thing, the image
// library is another, and mixing them in one list made both harder to read.
const MediaGroup = ({
  title,
  action,
  children
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex flex-col space-y-1">
    <div className="flex h-6 items-center justify-between px-2">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{title}</span>
      {action}
    </div>
    {children}
  </div>
);

export const Storage = () => {
  const { t } = useTranslation();
  const [notificationApi, contextHolder] = notification.useNotification();
  const { modal } = App.useApp();

  const [media, setMedia] = useState<api.MediaItem[]>([]);
  const [caps, setCaps] = useState<api.MediaCapabilities>({ loop: true });
  const [state, setState] = useState<api.MediaStateInfo>({
    state: 'none',
    hidOnly: false,
    open: [],
    cdrom: false
  });
  // The mode the next mount uses. It follows what is attached, so the control
  // shows the mode the target machine is looking at rather than a stale choice.
  const [mountAsCdrom, setMountAsCdrom] = useState(false);
  const [selected, setSelected] = useState<string>(''); // "<type>:<rel>"
  const [isLoading, setIsLoading] = useState(true);
  const [storageSignal, setStorageSignal] = useState(0);
  const [job, setJob] = useState<api.MediaStatus | null>(null);
  const [browsePath, setBrowsePath] = useState('/');
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    ok: () => void | Promise<void>;
  } | null>(null);
  const lastStatus = useRef<api.MediaStatus['status']>('idle');

  // Both callbacks are handed to children that poll with them in their
  // dependency lists: a new identity on every render would tear the intervals
  // down and re-list the medium every few seconds.
  const notifyError = useCallback(
    (message: string, description?: string) => {
      notificationApi.error({
        message: message || t('storage.failed'),
        description,
        duration: 10
      });
    },
    [notificationApi, t]
  );

  const refresh = useCallback(async () => {
    const rsp = await api.getMedia();
    if (rsp.code === 0) {
      setMedia(rsp.data?.media ?? []);
      setCaps(rsp.data?.capabilities ?? { loop: true });
    }

    const stateRsp = await api.getMediaState();
    if (stateRsp.code === 0) {
      setState(stateRsp.data);
    }
  }, []);

  useEffect(() => {
    void refresh().finally(() => setIsLoading(false));

    const timer = setInterval(() => void refresh(), statePollInterval);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (state.state === 'image' || state.state === 'partition') {
      setMountAsCdrom(state.cdrom);
    }
  }, [state.state, state.cdrom]);

  // The server refreshes the shared files view on a timer while the target
  // machine owns the partition and pushes a storage event, which is how the
  // file listing stays current. The medium list keeps its own poll above: a
  // refresh only means the files changed, and re-walking the medium directory
  // on every one of those events would cost more than it shows.
  useEffect(() => {
    const ws = new WsClient();
    ws.connect();
    const unsubscribe = ws.on('storage', () => setStorageSignal((signal) => signal + 1));
    return () => {
      unsubscribe();
      ws.close();
    };
  }, []);

  // Poll the media job while one is running: creating a medium writes
  // gigabytes to the card, so the page reports it like any other transfer.
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const rsp = await api.getMediaStatus();
      if (cancelled || rsp.code !== 0) return;

      const status: api.MediaStatus = rsp.data;

      if (status.status === 'success' && lastStatus.current === 'in_progress') {
        await refresh();
      }
      lastStatus.current = status.status;

      // A finished job leaves its last state behind for the next caller to
      // read, so only a running or failed one belongs on screen.
      setJob(status.status === 'in_progress' || status.status === 'failed' ? status : null);
    }

    void poll();
    const timer = setInterval(() => void poll(), 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refresh]);

  // Operations the target machine can refuse are confirmed here rather than in
  // the menu panel: this page is a full window, so a dialog cannot be
  // swallowed by a popover closing.
  const { mount, eject, busy } = useMediaMount({
    onError: notifyError,
    onNeedEnableDisk: (retry) =>
      setConfirm({
        title: t('storage.enableDisk.title'),
        description: t('storage.enableDisk.desc'),
        ok: async () => {
          // Ask for the state, do not toggle: the disk being off is why this
          // dialog appeared, and a toggle would be wrong if that changed.
          const rsp = await api.setVirtualDevice('disk', true);
          if (rsp.code !== 0) {
            notifyError(rsp.msg);
            return;
          }
          retry();
        }
      }),
    onNeedForce: (retry) =>
      setConfirm({
        title: t('storage.force.title'),
        description: t('storage.force.desc'),
        ok: retry
      }),
    onChanged: () => void refresh()
  });

  // The target machine holding the data partition is what keeps this page
  // from writing anything: the image uploads and the file uploads inside a
  // medium both land on that one filesystem, so they share this condition.
  const dataOwned = state.state === 'partition';

  const addMedia = useAddMedia({
    dataOwned,
    onChanged: () => void refresh(),
    onError: notifyError
  });

  const volumeMedia = useMemo(() => media.filter((item) => item.type === 'partition'), [media]);
  const images = useMemo(() => media.filter((item) => item.type === 'image'), [media]);

  const selectedMedia = useMemo(
    () => media.find((item) => `${item.type}:${item.rel}` === selected) ?? null,
    [media, selected]
  );

  // The listing and the toolbar above it read the same folder, and switching
  // medium always starts at its root.
  useEffect(() => {
    setBrowsePath('/');
  }, [selected]);

  // Why the file browser is unavailable, if it is: each reason has its own
  // sentence, because "you have to eject it on the target machine first" and
  // "this image holds no browsable filesystem" are different problems. An ISO
  // is the third case: it is a filesystem the kernel of this device does not
  // carry (CONFIG_ISO9660_FS), so its contents cannot be listed even though the
  // image itself is served to the target machine like any other medium.
  const browseBlockReason = ((): 'attached' | 'notBrowsable' | 'isoImage' | 'noLoop' | '' => {
    if (!selectedMedia) return '';

    // The data partition is a directory on this device: it needs no loop
    // device, and it can be read in every state, including while the target
    // machine has it. Only writing to it has to wait for an eject.
    if (selectedMedia.type === 'partition') return '';

    if (!caps.loop) return 'noLoop';
    if (!selectedMedia.browsable) {
      return selectedMedia.fs === 'iso9660' ? 'isoImage' : 'notBrowsable';
    }
    // An image is mounted as a block device to be read, and a block device the
    // target machine is writing underneath is not something to browse.
    if (selectedMedia.attached) return 'attached';
    return '';
  })();

  // A download the browser starts on its own saves whatever comes back, so a
  // refused request ends up as a file named after the URL. The status is asked
  // for first - one byte of the image, aborted as soon as the headers arrive -
  // and a refusal is reported the way the rest of the page reports errors.
  async function downloadImage(item: api.MediaItem) {
    const url = api.mediaImageDownloadUrl(item.rel);
    const controller = new AbortController();

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Range: 'bytes=0-0' },
        signal: controller.signal
      });
    } catch {
      notifyError(t('storage.failed'));
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      controller.abort();
      notifyError(data?.msg ?? `${response.status} ${response.statusText}`);
      return;
    }

    controller.abort();

    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function confirmDelete(item: api.MediaItem) {
    modal.confirm({
      title: t('storage.deleteTitle'),
      content: t('storage.deleteConfirm', { name: item.name }),
      okText: t('storage.yes'),
      cancelText: t('storage.no'),
      okButtonProps: { danger: true },
      onOk: async () => {
        const rsp = await api.deleteMedia({ type: item.type, rel: item.rel });
        if (rsp.code !== 0) {
          notifyError(rsp.msg);
          return;
        }
        if (selected === `${item.type}:${item.rel}`) setSelected('');
        await refresh();
      }
    });
  }

  const browser = useFileBrowser({
    media: selectedMedia,
    share: volumeMedia[0] ?? null,
    reason: browseBlockReason,
    dataOwned,
    path: browsePath,
    onPathChange: setBrowsePath,
    changeSignal: storageSignal,
    onMediaChanged: () => void refresh(),
    onError: notifyError
  });

  const attachedName = useMemo(() => {
    if (state.state === 'partition') {
      return t('storage.typePartition');
    }
    if (state.state === 'image') {
      return (
        media.find((item) => item.type === 'image' && item.rel === state.rel)?.name ??
        state.rel ??
        ''
      );
    }
    return '';
  }, [media, state, t]);

  // Every transfer the page runs is shown at the top in one shape: the media
  // job (a file written into a medium) and an image arriving from the browser
  // or a URL. They used to be two differently styled hints in two places.
  function renderTransfer(transfer: {
    name: string;
    percentage: string;
    loaded: number;
    total: number;
    failed: boolean;
    message?: string;
    onCancel?: () => void;
  }) {
    return (
      <Alert
        className="mb-3"
        type={transfer.failed ? 'error' : 'info'}
        showIcon
        icon={
          transfer.failed ? undefined : (
            <LoaderCircleIcon size={14} className="animate-spin" />
          )
        }
        message={
          transfer.failed ? (
            transfer.message || t('storage.failed')
          ) : (
            <span className="flex items-center space-x-2">
              <span className="min-w-0 truncate" title={transfer.name}>
                {t('storage.job.running', { name: transfer.name })}
              </span>
              {transfer.total > 0 && (
                <span className="shrink-0 text-neutral-400">
                  {transfer.percentage} · {formatSize(transfer.loaded)} /{' '}
                  {formatSize(transfer.total)}
                </span>
              )}
            </span>
          )
        }
        action={
          transfer.onCancel && (
            <Button
              type="text"
              size="small"
              icon={<XIcon size={12} />}
              title={t('download.cancel')}
              onClick={transfer.onCancel}
            />
          )
        }
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-neutral-950 p-6 text-neutral-200">
      <Head title={t('head.storage')} />
      {contextHolder}
      {addMedia.overlays}
      {browser.overlays}

      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center space-x-2">
            <HardDriveIcon size={18} />
            <span className="text-lg font-bold">{t('storage.title')}</span>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            {state.state === 'unsupported' ? (
              <span className="text-neutral-500">
                {state.hidOnly ? t('storage.hidOnly') : t('storage.disabled')}
              </span>
            ) : state.state === 'none' ? (
              <span className="text-neutral-500">{t('storage.notAttached')}</span>
            ) : (
              <>
                <span className="text-blue-500">
                  {t('storage.attached', { name: attachedName })}
                </span>
                <Button
                  size="small"
                  icon={<UnplugIcon size={14} />}
                  loading={busy === 'eject'}
                  onClick={() => void eject()}
                >
                  {t('storage.eject')}
                </Button>
              </>
            )}
          </div>
        </div>

        {job &&
          renderTransfer({
            name: job.name,
            percentage: job.percentage,
            loaded: job.loaded,
            total: job.total,
            failed: job.status === 'failed',
            message: job.message
          })}
        {addMedia.transfer &&
          renderTransfer({
            name: addMedia.transfer.name,
            percentage: addMedia.transfer.percentage,
            loaded: addMedia.transfer.loaded,
            total: addMedia.transfer.total,
            failed: addMedia.transfer.failed,
            message: addMedia.transfer.message,
            // Cancelling a finished download only earns an error from the
            // server, so the button goes away with the failure.
            onCancel:
              addMedia.transfer.cancellable && !addMedia.transfer.failed
                ? () => void addMedia.cancelTransfer()
                : undefined
          })}

        <Modal
          title={confirm?.title}
          open={!!confirm}
          okText={t('storage.yes')}
          cancelText={t('storage.no')}
          onOk={() => {
            const pending = confirm;
            setConfirm(null);
            void pending?.ok();
          }}
          onCancel={() => setConfirm(null)}
        >
          <p>{confirm?.description}</p>
        </Modal>

        <div className="grid min-h-0 flex-1 grid-cols-[320px_1fr] gap-6">
          <div className="flex min-h-0 flex-col space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs uppercase tracking-wide text-neutral-500">
                {t('storage.mountMode')}
              </span>
              <Segmented
                size="small"
                value={mountAsCdrom ? 'cdrom' : 'disk'}
                disabled={busy !== '' || state.state === 'unsupported'}
                onChange={(value) => setMountAsCdrom(value === 'cdrom')}
                options={[
                  {
                    value: 'disk',
                    label: (
                      <div className="flex items-center space-x-1">
                        <HardDriveIcon size={14} />
                        <span>{t('storage.mountModeDisk')}</span>
                      </div>
                    )
                  },
                  {
                    value: 'cdrom',
                    label: (
                      <div className="flex items-center space-x-1">
                        <DiscIcon size={14} />
                        <span>{t('storage.mountModeCdrom')}</span>
                      </div>
                    )
                  }
                ]}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-auto">
              {isLoading ? (
                <div className="flex flex-1 items-center justify-center text-neutral-500">
                  <LoaderCircleIcon size={18} className="animate-spin" />
                </div>
              ) : (
                <>
                  <MediaGroup title={t('storage.groups.share')} action={browser.toolbar}>
                    {renderRows(volumeMedia)}
                  </MediaGroup>

                  <MediaGroup title={t('storage.groups.images')} action={addMedia.actions}>
                    {images.length === 0 ? (
                      <div className="flex flex-col space-y-1 px-2 py-1">
                        <span className="text-xs text-neutral-500">{t('storage.empty')}</span>
                        <span className="text-xs text-neutral-600">
                          {t('storage.add.copyHint')}
                        </span>
                      </div>
                    ) : (
                      renderRows(images)
                    )}
                  </MediaGroup>
                </>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col">{browser.content}</div>
        </div>
      </div>
    </div>
  );

  function renderRows(items: api.MediaItem[]) {
    return (
      <div className="space-y-1">
        {items.map((item) => {
          const key = `${item.type}:${item.rel}`;
          const isBusy = busy === key;

          return (
            <div
              key={key}
              className={clsx(
                'group flex cursor-pointer items-center justify-between rounded px-2 py-2 text-sm hover:bg-neutral-800/70',
                selected === key && 'bg-neutral-800/70',
                item.attached && 'text-blue-500'
              )}
              onClick={() => {
                // The listing must not ask the new medium for the old path.
                setBrowsePath('/');
                setSelected(key);
              }}
            >
              <div className="flex min-w-0 flex-1 items-center space-x-2">
                <MediaIcon item={item} className="shrink-0" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate" title={item.name}>
                    {item.type === 'partition' ? t('storage.typePartition') : item.name}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {item.type === 'partition' ? t('storage.volumeLabel') : formatSize(item.size)}
                    {item.fs && item.fs !== 'unknown' ? ` · ${item.fs}` : ''}
                  </span>
                </div>
              </div>

              <div
                className="flex shrink-0 items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(event) => event.stopPropagation()}
              >
                {item.attached ? (
                  <Tooltip title={t('storage.eject')}>
                    <Button
                      type="text"
                      size="small"
                      icon={<UnplugIcon size={14} />}
                      onClick={() => void eject()}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip
                    title={
                      mountAsCdrom && item.fs !== 'iso9660'
                        ? t('storage.add.cdromOnlyIso')
                        : t('storage.mount')
                    }
                  >
                    <Button
                      type="text"
                      size="small"
                      loading={isBusy}
                      disabled={mountAsCdrom && item.fs !== 'iso9660'}
                      icon={<PlugIcon size={14} />}
                      onClick={() => void mount(item, mountAsCdrom)}
                    />
                  </Tooltip>
                )}

                {item.type === 'image' && (
                  <>
                    <Tooltip
                      title={item.attached ? t('storage.add.blocked') : t('storage.downloadImage')}
                    >
                      <Button
                        type="text"
                        size="small"
                        disabled={item.attached}
                        icon={<DownloadIcon size={14} />}
                        onClick={() => void downloadImage(item)}
                      />
                    </Tooltip>
                    <Tooltip
                      title={
                        dataOwned || item.attached ? t('storage.add.blocked') : t('storage.delete')
                      }
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        disabled={dataOwned || item.attached}
                        icon={<Trash2Icon size={14} />}
                        onClick={() => confirmDelete(item)}
                      />
                    </Tooltip>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
};

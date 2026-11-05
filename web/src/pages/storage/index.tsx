import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth.ts';
import {
  Alert,
  App,
  Button,
  ConfigProvider,
  Modal,
  notification,
  Segmented,
  theme,
  Tooltip
} from 'antd';
import clsx from 'clsx';
import {
  CheckIcon,
  DiscIcon,
  DownloadIcon,
  FolderSyncIcon,
  HardDriveIcon,
  LinkIcon,
  LoaderCircleIcon,
  PlugIcon,
  Trash2Icon,
  UnplugIcon,
  UploadIcon,
  XIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/media.ts';
import { formatSize } from '@/lib/format.ts';
import { MediaIcon } from '@/lib/media-icons.tsx';
import { WsClient } from '@/lib/websocket.ts';
import { useMediaMount } from '@/hooks/useMediaMount.ts';
import { Head } from '@/components/head.tsx';
import { ButtonBase } from '@/components/ui/button-base.tsx';

import { useAddMedia } from './use-add-media.tsx';
import { useFileBrowser, type FileUpload } from './use-file-browser.tsx';

const statePollInterval = 5000;

// The failed media job the user closed. The server keeps a failed job's state
// until the next job starts, so without this it would come back on every visit.
const dismissedJobKey = 'nanokvm-storage-dismissed-job';

function readDismissedJob(): string {
  try {
    return localStorage.getItem(dismissedJobKey) ?? '';
  } catch {
    return '';
  }
}

function jobKey(job: api.MediaStatus): string {
  return `${job.name}\n${job.message}`;
}

function baseName(name: string): string {
  return name.split('/').filter(Boolean).pop() ?? name;
}

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
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-300">{title}</span>
      {action}
    </div>
    {children}
  </div>
);

type StorageViewProps = {
  // 'mount' is the disk-mount manager; 'files' is the shared-files browser.
  // The desktop menu opens each inside its own modal; the standalone page
  // switches between them with a segmented control.
  view: 'mount' | 'files';
  active: boolean;
  // Extra slot on the header's right side (the modals put their close button
  // there, the page puts its view switch).
  headerExtra?: ReactNode;
  // The page fills the window; a modal sizes itself.
  fullPage?: boolean;
};

const StorageContent = ({ view, active, headerExtra, fullPage }: StorageViewProps) => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { token } = theme.useToken();
  const [notificationApi, contextHolder] = notification.useNotification();
  const { modal } = App.useApp();

  // Attaching a medium hands it to the target machine; writing changes what the
  // library keeps. Reading is implied by both, so the page itself is already
  // behind library.read.
  const canAttach = hasPermission('medium.attach');
  const canWrite = hasPermission('library.write');
  // Turning the virtual disk on is a device setting, so only an account that
  // may change device settings can do it from here.
  const canDevice = hasPermission('device');
  // The storage push rides on the console socket, so an account without the
  // console grant waits for the refresh button instead.
  const canWatchConsole = hasPermission('console.view');

  const [media, setMedia] = useState<api.MediaItem[]>([]);
  const [state, setState] = useState<api.MediaStateInfo>({
    state: 'none',
    hidOnly: false,
    open: [],
    cdrom: false,
    localWritable: true
  });
  // The mode the next mount uses. It follows what is attached, so the control
  // shows the mode the target machine is looking at rather than a stale choice.
  const [mountAsCdrom, setMountAsCdrom] = useState(false);
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
  const [dismissedJob, setDismissedJob] = useState(readDismissedJob);
  // Names of file uploads whose failure the page has already explained: a
  // cancelled request and a name that is already taken both leave a failed
  // media job behind, and the job is not news to a user who has been told.
  const cancelledUploads = useRef(new Set<string>());
  const activeRef = useRef(active);
  activeRef.current = active;

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

  // This runs on a timer, so a request that fails (the device rebooting, the
  // network dropping) is left to the next round instead of raising a
  // notification every few seconds.
  const refresh = useCallback(async () => {
    if (!activeRef.current) return;
    try {
      // State recovery recreates /data, so list files from the fresh mount.
      const stateRsp = await api.getMediaState();
      if (!activeRef.current) return;
      if (stateRsp.code === 0) {
        setState(stateRsp.data);
      }

      const rsp = await api.getMedia();
      if (!activeRef.current) return;
      if (rsp.code === 0) {
        setMedia(rsp.data?.media ?? []);
      }
    } catch {
      // Retried by the poll.
    }
  }, []);

  const refreshMedia = useCallback(async () => {
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (!active) return;
    void refresh().finally(() => setIsLoading(false));

    const timer = setInterval(() => void refresh(), statePollInterval);
    return () => clearInterval(timer);
  }, [active, refresh]);

  useEffect(() => {
    if (state.state === 'image' || state.state === 'partition') {
      setMountAsCdrom(state.cdrom);
    }
  }, [state.state, state.cdrom]);

  // The server pushes "the shared files changed" over the console socket while
  // the target machine owns the partition. Depend on the grant, not on
  // hasPermission: that changes identity with every account refresh, which
  // would tear the socket down on each auth push.
  useEffect(() => {
    if (!active || !canWatchConsole || view !== 'files') return;

    const ws = new WsClient();
    ws.connect();
    const unsubscribe = ws.on('storage', () => setStorageSignal((signal) => signal + 1));
    return () => {
      unsubscribe();
      ws.close();
    };
  }, [active, canWatchConsole, view]);

  // The push above rides on a socket an account may not have. Without it the
  // listing only ever changes when the user asks, which reads as a broken file
  // manager while the target machine writes: poll the way the NanoKVM Go file
  // manager does instead. Only while the target machine owns the partition is
  // there anything to see.
  useEffect(() => {
    if (!active || canWatchConsole || view !== 'files' || state.state !== 'partition') return;

    const timer = setInterval(() => {
      if (document.hidden) return;
      setStorageSignal((signal) => signal + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, [active, canWatchConsole, view, state.state]);

  // Poll the media job while one is running: creating a medium writes
  // gigabytes to the card, so the page reports it like any other transfer.
  // Only the file manager runs such a job, so only it polls.
  useEffect(() => {
    if (!active || view !== 'files') return;
    let cancelled = false;

    async function poll() {
      let rsp;
      try {
        rsp = await api.getMediaStatus();
      } catch {
        return;
      }
      if (cancelled || rsp.code !== 0) return;

      const status: api.MediaStatus = rsp.data;

      if (status.status === 'success' && lastStatus.current === 'in_progress') {
        await refresh();
      }
      lastStatus.current = status.status;
      if (status.status === 'in_progress') {
        cancelledUploads.current.delete(baseName(status.name));
      }

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
  }, [active, refresh, view]);

  // Operations the target machine can refuse are confirmed here rather than in
  // the menu panel: a dialog cannot be swallowed by a popover closing.
  const { mount, eject, busy } = useMediaMount({
    onError: notifyError,
    onNeedEnableDisk: canDevice
      ? (retry) =>
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
          })
      : () => notifyError(t('storage.enableDisk.askDevice')),
    onNeedForce: (retry) =>
      setConfirm({
        title: t('storage.force.title'),
        description: t('storage.force.desc'),
        ok: retry
      }),
    onChanged: refreshMedia
  });

  // The target machine holding the data partition is what keeps this page
  // from writing anything: the image uploads and the file uploads inside a
  // medium both land on that one filesystem, so they share this condition.
  const dataOwned = state.state === 'partition';
  // Both reasons a write would be refused: the target machine owns the disk, or
  // the mount has not been handed back yet. The controls that write ask this.
  const writeBlocked = dataOwned || !state.localWritable;

  const addMedia = useAddMedia({
    writeBlocked,
    onChanged: refreshMedia,
    onError: notifyError
  });

  const images = useMemo(() => media.filter((item) => item.type === 'image'), [media]);
  // The partition is the one medium the file browser shows: it is what the
  // emulated disk serves by default, and it needs no loop device to be read.
  const sharedPartition = useMemo(
    () => media.find((item) => item.type === 'partition') ?? null,
    [media]
  );

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
        credentials: api.fetchCredentials(),
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
        let rsp;
        try {
          rsp = await api.deleteMedia({ type: item.type, rel: item.rel });
        } catch {
          notifyError(t('storage.failed'));
          return;
        }
        if (rsp.code !== 0) {
          notifyError(rsp.msg);
          return;
        }
        await refresh();
      }
    });
  }

  const browser = useFileBrowser({
    active: active && view === 'files',
    // The file browser shows the shared partition; the mount view never
    // browses, and passing null skips its listing poll.
    media: sharedPartition,
    dataOwned,
    localWritable: state.localWritable,
    path: browsePath,
    onPathChange: setBrowsePath,
    changeSignal: storageSignal,
    onMediaChanged: refreshMedia,
    onNameTaken: (name) => cancelledUploads.current.add(name),
    onError: notifyError
  });

  // Every transfer the page runs is shown at the top in one shape: the media
  // job (a file written into a medium) and an image arriving from the browser
  // or a URL. They used to be two differently styled hints in two places.
  function renderTransfer(transfer: {
    key: string;
    label: string;
    percentage: string;
    loaded: number;
    total: number;
    state: 'running' | 'success' | 'failed';
    message?: string;
    onCancel?: () => void;
    onClose?: () => void;
  }) {
    const failed = transfer.state === 'failed';
    return (
      <Alert
        key={transfer.key}
        className="mb-3"
        type={failed ? 'error' : transfer.state === 'success' ? 'success' : 'info'}
        showIcon
        icon={
          failed ? undefined : transfer.state === 'success' ? (
            <CheckIcon size={14} />
          ) : (
            <LoaderCircleIcon size={14} className="animate-spin" />
          )
        }
        closable={failed && !!transfer.onClose}
        onClose={transfer.onClose}
        message={
          failed ? (
            transfer.message || t('storage.failed')
          ) : (
            <span className="flex items-center space-x-2">
              <span className="min-w-0 truncate" title={transfer.label}>
                {transfer.label}
              </span>
              {transfer.state === 'running' && transfer.total > 0 && (
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

  function dismissJob(key: string) {
    setDismissedJob(key);
    try {
      localStorage.setItem(dismissedJobKey, key);
    } catch {
      // Remembered for this visit only.
    }
  }

  // A file upload from the browser is the media job the server reports, so
  // the job carries that upload's cancel button. Uploads still waiting for
  // the job slot are shown on their own.
  const jobUpload =
    job?.status === 'in_progress'
      ? browser.uploads.find((upload) => upload.name === baseName(job.name))
      : undefined;
  const waitingUploads = browser.uploads.filter((upload) => upload !== jobUpload);
  const showJob =
    !!job &&
    !(
      job.status === 'failed' &&
      (dismissedJob === jobKey(job) || cancelledUploads.current.has(baseName(job.name)))
    );

  function cancelUpload(upload: FileUpload) {
    cancelledUploads.current.add(upload.name);
    upload.cancel();
  }

  const addTransfer = addMedia.transfer;
  const addTransferLabel = !addTransfer
    ? ''
    : addTransfer.state === 'success'
      ? t('storage.add.done', { name: addTransfer.name })
      : addTransfer.kind === 'upload'
        ? t('storage.add.uploading', { name: addTransfer.name })
        : t('storage.add.downloading', { name: addTransfer.name });

  // A write the target machine would refuse is explained once, above the file
  // manager: the buttons there are disabled, and a tooltip per button does not
  // say why all of them are.
  const filesReadOnlyHint = view === 'files' && dataOwned && (
    <div className="shrink-0 pb-3 text-xs text-neutral-400">
      {t('storage.files.reasonAttached')}
    </div>
  );

  return (
    <div
      className={clsx(
        'box-border w-full text-neutral-200',
        view === 'files'
          ? 'flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5'
          : 'overflow-auto p-4 sm:p-5',
        fullPage && 'h-full'
      )}
      style={{ backgroundColor: token.colorBgElevated }}
    >
      {contextHolder}
      {addMedia.overlays}
      {browser.overlays}

      <div
        className={clsx(
          'mx-auto flex min-h-0 flex-col',
          view === 'files' ? 'h-full w-full max-w-6xl' : 'max-w-xl',
          fullPage && view === 'mount' && 'h-full'
        )}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center text-neutral-300">
              {view === 'mount' ? <HardDriveIcon size={20} /> : <FolderSyncIcon size={20} />}
            </div>
            <span className="text-lg font-semibold text-neutral-100">
              {view === 'mount' ? t('storage.cards.mount') : t('storage.cards.share')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {state.state === 'unsupported' && (
              <span className="rounded-full border border-solid border-neutral-600 px-3 py-1 text-xs text-neutral-300">
                {state.hidOnly ? t('storage.hidOnly') : t('storage.disabled')}
              </span>
            )}
            {headerExtra}
          </div>
        </div>

        {/* The media job reports one thing only: a file being written into the
            shared folder by the file manager. The mount window is a different
            surface, so a transfer started over there must not appear here. */}
        {view === 'files' &&
          job &&
          showJob &&
          renderTransfer({
            key: 'job',
            label: t('storage.job.running', { name: job.name }),
            percentage: job.percentage,
            loaded: job.loaded,
            total: job.total,
            state: job.status === 'failed' ? 'failed' : 'running',
            message: job.message,
            onCancel: jobUpload ? () => cancelUpload(jobUpload) : undefined,
            onClose: () => dismissJob(jobKey(job))
          })}
        {view === 'files' &&
          waitingUploads.map((upload) =>
            renderTransfer({
              key: `upload-${upload.id}`,
              label: t('storage.add.uploading', { name: upload.name }),
              percentage: '',
              loaded: 0,
              total: 0,
              state: 'running',
              onCancel: () => cancelUpload(upload)
            })
          )}
        {addTransfer &&
          renderTransfer({
            key: `add-${addTransfer.id}`,
            label: addTransferLabel,
            percentage: addTransfer.percentage,
            loaded: addTransfer.loaded,
            total: addTransfer.total,
            state: addTransfer.state,
            message: addTransfer.message,
            // Cancelling a finished transfer only earns an error from the
            // server, so the button goes away once it ends.
            onCancel:
              addTransfer.cancellable && addTransfer.state === 'running'
                ? () => void addMedia.cancelTransfer()
                : undefined,
            onClose: addMedia.dismissTransfer
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

        {view === 'mount' ? (
          <div className="flex flex-col gap-4">
            <div className="shrink-0">
              <div className="flex flex-col gap-3">
                <div className="h-px bg-neutral-700" />

                {canAttach && (
                  <>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-neutral-300">
                        {t('storage.mountMode')}
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          {
                            value: 'disk',
                            icon: HardDriveIcon,
                            label: t('storage.mountModeDisk')
                          },
                          {
                            value: 'cdrom',
                            icon: DiscIcon,
                            label: t('storage.mountModeCdrom')
                          }
                        ].map((modeOption) => {
                          const cdrom = modeOption.value === 'cdrom';
                          const isSelected = mountAsCdrom === cdrom;
                          const disabled =
                            busy !== '' || state.state === 'image' || state.state === 'unsupported';
                          return (
                            <ButtonBase
                              key={modeOption.value}
                              disabled={disabled}
                              onClick={() => setMountAsCdrom(cdrom)}
                              className={clsx(
                                'relative flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-neutral-900 text-neutral-300 enabled:hover:bg-neutral-800 enabled:hover:text-white'
                              )}
                            >
                              <modeOption.icon size={15} className="shrink-0" />
                              <span className="min-w-0 whitespace-normal break-words text-center leading-tight">
                                {modeOption.label}
                              </span>
                            </ButtonBase>
                          );
                        })}
                      </div>
                    </div>

                    <div className="h-px bg-neutral-700" />
                  </>
                )}

                {canWrite && (
                  <>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-neutral-300">
                        {t('storage.add.title')}
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          {
                            icon: UploadIcon,
                            label: t('storage.add.upload'),
                            open: addMedia.openUpload
                          },
                          {
                            icon: LinkIcon,
                            label: t('storage.add.fromUrl'),
                            open: addMedia.openUrl
                          }
                        ].map((action) => (
                          <Tooltip
                            key={action.label}
                            title={writeBlocked ? t('storage.add.blocked') : undefined}
                          >
                            <span className="block min-w-0">
                              <ButtonBase
                                disabled={addMedia.addDisabled}
                                onClick={action.open}
                                className="flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-md bg-neutral-900 px-2 py-2 text-center text-sm text-neutral-300 transition-colors enabled:hover:bg-neutral-800 enabled:hover:text-white disabled:text-neutral-400"
                              >
                                <action.icon size={16} className="shrink-0" />
                                <span className="min-w-0 whitespace-normal break-words leading-snug">
                                  {action.label}
                                </span>
                              </ButtonBase>
                            </span>
                          </Tooltip>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-neutral-700" />
                  </>
                )}
              </div>
            </div>

            <div className="flex max-h-[55vh] flex-col gap-4 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-6 text-neutral-400">
                  <LoaderCircleIcon size={18} className="animate-spin" />
                </div>
              ) : (
                <MediaGroup title={t('storage.groups.images')}>
                  {images.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neutral-600 px-3 py-3 text-center text-xs text-neutral-200">
                      {t('storage.empty')}
                    </div>
                  ) : (
                    renderRows(images)
                  )}
                </MediaGroup>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {filesReadOnlyHint}
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center text-neutral-400">
                <LoaderCircleIcon size={18} className="animate-spin" />
              </div>
            ) : (
              browser.content
            )}
          </div>
        )}
      </div>
    </div>
  );

  function renderRows(items: api.MediaItem[]) {
    return (
      <div className="space-y-1.5">
        {items.map((item) => {
          const key = `${item.type}:${item.rel}`;
          const isBusy = busy === key;
          // A CD-ROM mode only carries an optical image; the button says why it
          // cannot be used on the others.
          const wrongMode = mountAsCdrom && !api.isOpticalImage(item);

          return (
            <div
              key={key}
              className="group flex items-center gap-3 rounded-lg border border-solid border-neutral-700 px-3 py-2.5 text-sm transition-colors"
            >
              <div
                className={clsx(
                  'flex h-9 w-9 shrink-0 items-center justify-center',
                  item.attached ? 'text-blue-400' : 'text-neutral-300'
                )}
              >
                <MediaIcon item={item} size={17} />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-neutral-100" title={item.name}>
                    {item.name}
                  </span>
                  {item.attached && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  )}
                </div>
                <span className="text-xs text-neutral-300">
                  {formatSize(item.size)}
                  {item.fs && item.fs !== 'unknown' ? ` · ${item.fs}` : ''}
                </span>
              </div>

              <div
                className="flex shrink-0 items-center space-x-1"
                onClick={(event) => event.stopPropagation()}
              >
                {canAttach &&
                  (item.attached ? (
                    <Tooltip title={t('storage.eject')}>
                      <Button
                        type="default"
                        size="small"
                        loading={busy === 'eject'}
                        icon={<UnplugIcon size={14} />}
                        onClick={() => void eject()}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title={
                        state.state === 'image'
                          ? t('storage.add.blocked')
                          : wrongMode
                            ? t('storage.add.cdromOnlyIso')
                            : t('storage.mount')
                      }
                    >
                      <Button
                        type="default"
                        size="small"
                        loading={isBusy}
                        disabled={busy !== '' || state.state === 'image' || wrongMode}
                        icon={<PlugIcon size={14} />}
                        onClick={() => void mount(item, mountAsCdrom)}
                      />
                    </Tooltip>
                  ))}

                <Tooltip
                  title={item.attached ? t('storage.add.blocked') : t('storage.downloadImage')}
                >
                  <Button
                    type="default"
                    size="small"
                    disabled={item.attached}
                    icon={<DownloadIcon size={14} />}
                    onClick={() => void downloadImage(item)}
                  />
                </Tooltip>

                {canWrite && (
                  <Tooltip
                    title={
                      dataOwned || item.attached ? t('storage.add.blocked') : t('storage.delete')
                    }
                  >
                    <Button
                      type="default"
                      size="small"
                      danger
                      disabled={dataOwned || item.attached}
                      icon={<Trash2Icon size={14} />}
                      onClick={() => confirmDelete(item)}
                    />
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
};

// One surface, two faces: the desktop menu mounts this inside the disk-mount
// modal ('mount') and the file-manager modal ('files'), and the standalone
// storage page switches between them.
export const StorageView = ({ view, active, headerExtra, fullPage }: StorageViewProps) => {
  const { token } = theme.useToken();

  return (
    <ConfigProvider theme={{ token: { colorBgContainer: token.colorBgElevated } }}>
      <App className={clsx('h-full min-h-0', view === 'mount' && !fullPage && 'h-auto')}>
        <StorageContent view={view} active={active} headerExtra={headerExtra} fullPage={fullPage} />
      </App>
    </ConfigProvider>
  );
};

// The standalone page. Deep links and accounts that may only read the library
// land here; the desktop menu opens the same two views in modals.
export const Storage = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<'mount' | 'files'>('mount');

  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-200">
      <Head title={t('head.storage')} />

      <StorageView
        view={view}
        active
        fullPage
        headerExtra={
          <Segmented
            value={view}
            onChange={(value) => setView(value as 'mount' | 'files')}
            options={[
              {
                value: 'mount',
                label: (
                  <span className="flex items-center gap-1.5 px-1">
                    <HardDriveIcon size={14} />
                    <span>{t('storage.cards.mount')}</span>
                  </span>
                )
              },
              {
                value: 'files',
                label: (
                  <span className="flex items-center gap-1.5 px-1">
                    <FolderSyncIcon size={14} />
                    <span>{t('storage.cards.share')}</span>
                  </span>
                )
              }
            ]}
          />
        }
      />
    </div>
  );
};

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth.ts';
import { Divider, Segmented, Tooltip } from 'antd';
import clsx from 'clsx';
import {
  DiscIcon,
  ExternalLinkIcon,
  HardDriveIcon,
  LoaderCircleIcon,
  PlugIcon,
  UnplugIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/media.ts';
import { MediaIcon } from '@/lib/media-icons.tsx';
import { useMediaMount } from '@/hooks/useMediaMount.ts';
import { MenuItem } from '@/components/menu-item.tsx';

// The desktop menu keeps the actions that belong next to the screen - mount
// and eject - and hands everything else to the storage page, which opens in
// its own tab.
export const Storage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canMount = hasPermission('media.mount');
  // The virtual disk is a device setting, so whether the hint can point at an
  // enabled switch depends on this grant.
  const canDevice = hasPermission('device');

  const [media, setMedia] = useState<api.MediaItem[]>([]);
  const [error, setError] = useState('');
  const [state, setState] = useState<api.MediaStateInfo>({
    state: 'none',
    hidOnly: false,
    open: [],
    cdrom: false
  });
  const [mode, setMode] = useState<'mass-storage' | 'cd-rom'>('mass-storage');
  const [isOpen, setIsOpen] = useState(false);

  const { mount, eject, busy } = useMediaMount({
    onError: (message, description) =>
      setError(description ? `${message} — ${description}` : message),
    onNeedEnableDisk: () =>
      setError(t(canDevice ? 'storage.enableDisk.menuHint' : 'storage.enableDisk.askDevice')),
    onNeedForce: () => setError(t('storage.force.menuHint')),
    onChanged: () => void refresh()
  });

  async function refresh() {
    try {
      const rsp = await api.getMedia();
      if (rsp.code === 0) {
        setMedia(rsp.data?.media ?? []);
      }

      const stateRsp = await api.getMediaState();
      if (stateRsp.code === 0) {
        setState(stateRsp.data);
      }
    } catch {
      // Retried on the next open or poll.
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  // The list can change while the target machine owns the partition, so it is
  // re-read while the panel is open. Only then: listing the media while the
  // target machine owns the partition makes the server drop its caches, which
  // is not worth paying for a panel nobody is looking at.
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => void refresh(), 5000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // The mode control follows the attached medium, so it shows what the target
  // machine is actually looking at instead of the last choice made here.
  useEffect(() => {
    if (state.state === 'image' || state.state === 'partition') {
      setMode(state.cdrom ? 'cd-rom' : 'mass-storage');
    }
  }, [state.state, state.cdrom]);

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (open) void refresh();
  }

  // The partition's name is a fixed string in the API, so the panel names it
  // the way the storage page does instead of showing the untranslated one.
  function mediaName(item: api.MediaItem): string {
    return item.type === 'partition' ? t('storage.typePartition') : item.name;
  }

  function openPage() {
    window.open('/#storage', '_blank');
  }

  const attachedName =
    state.state === 'partition'
      ? t('storage.typePartition')
      : media.find((item) => item.type === 'image' && item.rel === state.rel)?.name;

  const modes = [
    {
      value: 'mass-storage',
      label: (
        <div className="flex items-center space-x-1">
          <HardDriveIcon size={14} />
          <span>{t('storage.mountModeDisk')}</span>
        </div>
      )
    },
    {
      value: 'cd-rom',
      label: (
        <div className="flex items-center space-x-1">
          <DiscIcon size={14} />
          <span>{t('storage.mountModeCdrom')}</span>
        </div>
      )
    }
  ];

  return (
    <MenuItem
      title={t('storage.title')}
      icon={<HardDriveIcon size={18} />}
      fresh={state.state !== 'none'}
      onOpenChange={handleOpenChange}
      content={
        <div className="flex w-[300px] flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">
              {state.state === 'none' || state.state === 'unsupported'
                ? t('storage.notAttached')
                : t('storage.attached', { name: attachedName ?? '' })}
            </span>

            {canMount && state.state !== 'none' && state.state !== 'unsupported' && (
              <Tooltip title={t('storage.eject')}>
                <div
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  onClick={() => void eject()}
                >
                  {busy === 'eject' ? (
                    <LoaderCircleIcon size={14} className="animate-spin" />
                  ) : (
                    <UnplugIcon size={14} />
                  )}
                </div>
              </Tooltip>
            )}
          </div>

          {state.state === 'unsupported' && (
            <span className="text-xs text-neutral-500">
              {state.hidOnly ? t('storage.hidOnly') : t('storage.disabled')}
            </span>
          )}

          {canMount && (
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('storage.mountMode')}</span>
              <Segmented
                size="small"
                value={mode}
                options={modes}
                onChange={(value) => setMode(value as 'mass-storage' | 'cd-rom')}
                disabled={state.state === 'unsupported' || busy !== ''}
              />
            </div>
          )}

          <Divider style={{ margin: '4px 0' }} />

          <div className="flex max-h-[240px] flex-col space-y-1 overflow-auto">
            {media.map((item) => {
              const key = `${item.type}:${item.rel}`;
              const isBusy = busy === key;

              return (
                <div
                  key={key}
                  className={clsx(
                    'group flex h-[28px] items-center justify-between rounded px-2 hover:bg-neutral-700/70',
                    item.attached && 'text-blue-500'
                  )}
                  onClick={() => canMount && !item.attached && void mount(item, mode === 'cd-rom')}
                >
                  <div className="flex min-w-0 flex-1 items-center space-x-2">
                    <MediaIcon item={item} />
                    <span className="truncate text-sm" title={mediaName(item)}>
                      {mediaName(item)}
                    </span>
                  </div>

                  {canMount && (
                    <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                      {isBusy ? (
                        <LoaderCircleIcon size={14} className="animate-spin" />
                      ) : (
                        !item.attached && <PlugIcon size={14} className="text-neutral-400" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Divider style={{ margin: '4px 0' }} />

          {error && <span className="break-words text-xs text-red-500">{error}</span>}

          <div
            className="flex cursor-pointer items-center space-x-1 rounded px-2 py-1 text-sm hover:bg-neutral-700/70"
            onClick={openPage}
          >
            <ExternalLinkIcon size={14} />
            <span>{t('storage.openManager')}</span>
          </div>
        </div>
      }
    />
  );
};

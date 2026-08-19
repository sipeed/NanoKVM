import { useEffect, useState } from 'react';
import { Switch, Tooltip } from 'antd';
import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

type ZramState = {
  available: boolean;
  enabled: boolean;
  active: boolean;
  algorithm: string;
  diskSize: number;
  original: number;
  compressed: number;
  memUsed: number;
  memLimit: number;
  swapIn: number;
  swapOut: number;
};

// formatBytes keeps one decimal place, which is enough to tell 3.2 MB from
// 3.9 MB on a board where the whole swap device is 96 MB.
function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB';

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }

  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export const Zram = () => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<ZramState | null>(null);

  useEffect(() => {
    getZram();
  }, []);

  function getZram() {
    setIsLoading(true);

    api
      .getZram()
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }
        setState(rsp.data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function update(enabled: boolean) {
    if (isLoading) return;
    setIsLoading(true);

    api
      .setZram(enabled)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
        }
      })
      .finally(() => {
        // Read the state back either way. The server rolls a failed enable
        // back, so what it reports is the only trustworthy answer.
        getZram();
      });
  }

  // status is the compact line under the description.
  function status(): string {
    if (!state) return '';
    if (!state.available) return t('settings.device.zram.unavailable');
    if (!state.active) {
      return state.enabled ? t('settings.device.zram.inactive') : t('settings.device.zram.off');
    }

    const ratio = state.compressed > 0 ? (state.original / state.compressed).toFixed(1) : '-';

    return t('settings.device.zram.active', {
      used: formatBytes(state.original),
      total: formatBytes(state.diskSize),
      ratio
    });
  }

  // detail is the tooltip on the status line. It is empty when there is no
  // running device to describe.
  function detail(): string[] {
    if (!state?.active) return [];

    const lines = [];

    if (state.algorithm) {
      lines.push(t('settings.device.zram.detail.algorithm', { algorithm: state.algorithm }));
    }

    lines.push(
      state.memLimit > 0
        ? t('settings.device.zram.detail.memory', {
            used: formatBytes(state.memUsed),
            limit: formatBytes(state.memLimit)
          })
        : t('settings.device.zram.detail.memoryNoLimit', { used: formatBytes(state.memUsed) })
    );

    lines.push(t('settings.device.zram.detail.counters', { in: state.swapIn, out: state.swapOut }));

    return lines;
  }

  const lines = detail();

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span>{t('settings.device.zram.title')}</span>

          <Tooltip
            title={t('settings.device.zram.tip')}
            className="cursor-pointer"
            placement="right"
            styles={{ root: { maxWidth: '400px' } }}
          >
            <CircleAlertIcon className="text-neutral-500" size={14} />
          </Tooltip>
        </div>

        <span className="text-xs text-neutral-500">{t('settings.device.zram.description')}</span>

        {state && (
          <Tooltip
            title={
              lines.length > 0 ? (
                <div className="flex flex-col">
                  {lines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              ) : null
            }
            placement="right"
            styles={{ root: { maxWidth: '400px' } }}
          >
            <span
              className={
                state.enabled && !state.active
                  ? 'w-fit cursor-default text-xs text-amber-500'
                  : 'w-fit cursor-default text-xs text-neutral-400'
              }
            >
              {status()}
            </span>
          </Tooltip>
        )}
      </div>

      <Switch
        checked={state?.enabled ?? false}
        disabled={!state?.available}
        loading={isLoading}
        onChange={update}
      />
    </div>
  );
};

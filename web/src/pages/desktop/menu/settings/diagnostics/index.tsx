import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { RefreshCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

type Diagnostics = {
  version: {
    app: string;
    image: string;
    hw: string;
    hdmiVersion: string;
    deviceKey: string;
    hostname: string;
    previewUpdates: boolean;
  };
  video: {
    nowFps: number;
    state: number;
    type: string;
    width: number;
    height: number;
    qlty: number;
    res: number;
    hdmiSignal: boolean;
    hdmiEnabled: boolean;
  };
  processes: Record<string, boolean>;
  firewall: {
    inputPolicy: string;
  };
};

export const Diagnostics = () => {
  const { t } = useTranslation();

  const [data, setData] = useState<Diagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setIsLoading(true);
    api
      .getDiagnostics()
      .then((rsp) => {
        if (rsp.data) {
          setData(rsp.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-base">{t('settings.diagnostics.title')}</div>
        <Button size="small" icon={<RefreshCwIcon size={12} />} loading={isLoading} onClick={load}>
          {t('settings.diagnostics.refresh')}
        </Button>
      </div>

      {data && (
        <div className="mt-6 flex flex-col space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.app')}</span>
            <span>{data.version.app || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.image')}</span>
            <span>{data.version.image || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.hw')}</span>
            <span>{data.version.hw || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.hdmiVersion')}</span>
            <span>{data.version.hdmiVersion || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.hostname')}</span>
            <span>{data.version.hostname || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.deviceKey')}</span>
            <span className="max-w-[200px] truncate">{data.version.deviceKey || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.previewUpdates')}</span>
            <span className={data.version.previewUpdates ? 'text-amber-400' : ''}>
              {data.version.previewUpdates ? t('settings.diagnostics.yes') : t('settings.diagnostics.no')}
            </span>
          </div>

          <div className="my-1 border-t border-neutral-700/50" />

          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.fps')}</span>
            <span className={data.video.nowFps > 0 ? 'text-green-500' : 'text-red-500'}>
              {data.video.nowFps}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.state')}</span>
            <span>{data.video.state}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.type')}</span>
            <span>{data.video.type || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.resolution')}</span>
            <span>
              {data.video.width}x{data.video.height}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.hdmiSignal')}</span>
            <span className={data.video.hdmiSignal ? 'text-green-500' : 'text-red-500'}>
              {data.video.hdmiSignal ? t('settings.diagnostics.yes') : t('settings.diagnostics.no')}
            </span>
          </div>

          <div className="my-1 border-t border-neutral-700/50" />

          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.processes')}</span>
            <span />
          </div>
          {Object.entries(data.processes).map(([name, running]) => (
            <div key={name} className="flex items-center justify-between">
              <span className="pl-3 text-neutral-500">{name}</span>
              <span className={running ? 'text-green-500' : 'text-red-500'}>
                {running ? t('settings.diagnostics.running') : t('settings.diagnostics.stopped')}
              </span>
            </div>
          ))}

          <div className="my-1 border-t border-neutral-700/50" />

          <div className="flex items-center justify-between">
            <span className="text-neutral-500">{t('settings.diagnostics.firewall')}</span>
            <span className={data.firewall.inputPolicy.includes('DROP') ? 'text-green-500' : 'text-amber-400'}>
              {data.firewall.inputPolicy || '-'}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

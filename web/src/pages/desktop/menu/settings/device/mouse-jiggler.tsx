import { useEffect, useState } from 'react';
import { Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';
import { setMouseJiggler } from '@/api/vm.ts';

export const MouseJiggler = () => {
  const { t } = useTranslation();

  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState('relative');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getMouseJiggler();
  }, []);

  const options = [
    { value: 'disable', label: t('settings.device.mouseJiggler.disable') },
    { value: 'relative', label: t('settings.device.mouseJiggler.relative') },
    { value: 'absolute', label: t('settings.device.mouseJiggler.absolute') }
  ];

  function getMouseJiggler() {
    setIsLoading(true);

    api
      .getMouseJiggler()
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setEnabled(rsp.data.enabled);
        setMode(rsp.data.mode);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function enable() {
    if (isLoading) return;
    setIsLoading(true);

    api
      .setMouseJiggler(true, mode)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setEnabled(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function updateMode(value: string) {
    if (isLoading) return;
    setIsLoading(true);

    const _enabled = value !== 'disable';
    const _mode = value === 'disable' ? 'relative' : value;

    setMouseJiggler(_enabled, _mode)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setEnabled(_enabled);
        setMode(_mode);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col space-y-1">
        <span>{t('settings.device.mouseJiggler.title')}</span>
        <span className="text-xs text-neutral-500">
          {t('settings.device.mouseJiggler.description')}
        </span>
      </div>

      {enabled ? (
        <Select
          style={{ width: 150 }}
          value={mode}
          options={options}
          loading={isLoading}
          onChange={updateMode}
        />
      ) : (
        <Switch checked={enabled} loading={isLoading} onChange={enable} />
      )}
    </div>
  );
};

import { useEffect, useState } from 'react';
import { Switch, Tooltip } from 'antd';
import { CircleHelpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

export const Memory = () => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    api.getMemoryLimit().then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setIsEnabled(!!rsp.data.enabled);
    });
  }, []);

  function update() {
    if (isLoading) return;
    setIsLoading(true);

    const enabled = !isEnabled;
    const limit = isEnabled ? 0 : 75;

    api
      .setMemoryLimit(enabled, limit)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setIsEnabled(enabled);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="flex h-[40px] cursor-pointer items-center justify-between space-x-6 rounded px-2 text-neutral-300 hover:bg-neutral-700/70">
      <div className="flex items-center space-x-1">
        <span>{t('settings.tailscale.memory.title')}</span>
        <Tooltip
          title={t('settings.tailscale.memory.tip')}
          className="cursor-pointer text-neutral-500"
          placement="top"
          styles={{ root: { maxWidth: '400px' } }}
        >
          <CircleHelpIcon size={15} />
        </Tooltip>
      </div>

      <Switch value={isEnabled} size="small" onClick={update} />
    </div>
  );
};

import { useEffect, useState } from 'react';
import { Select, Tooltip } from 'antd';
import { CircleHelpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

export const Memory = () => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [limit, setLimit] = useState('');

  const options = [
    { value: '0', label: t('settings.tailscale.memory.disable') },
    { value: '40', label: '40 MB' },
    { value: '50', label: '50 MB' },
    { value: '60', label: '60 MB' }
  ];

  useEffect(() => {
    api.getMemoryLimit().then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      const value = rsp.data.enabled ? rsp.data.limit.toString() : '0';
      setLimit(value);
    });
  }, []);

  function update(value: string) {
    if (isLoading) return;
    setIsLoading(true);

    const enabled = value !== '0';
    const limitNum = parseInt(value);

    api
      .setMemoryLimit(enabled, limitNum)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setLimit(value);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center space-x-1">
            <span>{t('settings.tailscale.memory.title')}</span>
            <Tooltip
              title={t('settings.tailscale.memory.tip')}
              className="cursor-pointer text-neutral-500"
              placement="top"
              overlayStyle={{ maxWidth: '350px' }}
            >
              <CircleHelpIcon size={15} />
            </Tooltip>
          </div>
        </div>

        <Select style={{ width: 100 }} value={limit} options={options} onChange={update} />
      </div>
    </>
  );
};

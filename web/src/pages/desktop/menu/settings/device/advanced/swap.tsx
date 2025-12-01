import { useEffect, useState } from 'react';
import { Select, Tooltip } from 'antd';
import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

export const Swap = () => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [size, setSize] = useState('0');

  const options = [
    { value: '0', label: t('settings.device.swap.disable') },
    { value: '64', label: '64 MB' },
    { value: '128', label: '128 MB' },
    { value: '256', label: '256 MB' },
    { value: '512', label: '512 MB' }
  ];

  useEffect(() => {
    getSwap();
  }, []);

  function getSwap() {
    setIsLoading(true);

    api
      .getSwap()
      .then((rsp) => {
        if (rsp.data?.size) {
          setSize(rsp.data.size.toString());
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function update(value: string) {
    if (isLoading) return;
    setIsLoading(true);

    api
      .setSwap(parseInt(value))
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setSize(value);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span>{t('settings.device.swap.title')}</span>

          <Tooltip
            title={t('settings.device.swap.tip')}
            className="cursor-pointer"
            placement="bottom"
            overlayStyle={{ maxWidth: '300px' }}
          >
            <CircleAlertIcon size={15} />
          </Tooltip>
        </div>
        <span className="text-xs text-neutral-500">{t('settings.device.swap.description')}</span>
      </div>

      <Select
        style={{ width: 150 }}
        value={size}
        options={options}
        loading={isLoading}
        onChange={update}
      />
    </div>
  );
};

import { Collapse } from 'antd';
import { useTranslation } from 'react-i18next';

import { Swap } from './swap.tsx';
import { Zram } from './zram.tsx';

const children = (
  <div className="space-y-6 py-3">
    <Zram />
    <Swap />
    {/*<Autostart />*/}
  </div>
);

export const Advanced = () => {
  const { t } = useTranslation();

  return (
    <Collapse
      ghost
      expandIconPosition="end"
      items={[{ key: 'advanced', label: t('settings.device.advanced'), children }]}
    />
  );
};

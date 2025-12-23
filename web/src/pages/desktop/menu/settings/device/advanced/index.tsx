import { Collapse } from 'antd';
import { useTranslation } from 'react-i18next';

import { Swap } from './swap.tsx';
import { Autostart } from './autostart.tsx';

const children = (
  <div className="py-3 space-y-6">
    <Swap />
    <Autostart />
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

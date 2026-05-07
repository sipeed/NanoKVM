import { Divider } from 'antd';
import { useTranslation } from 'react-i18next';

import { DNS } from './dns.tsx';
import { Tls } from './tls.tsx';
import { Wifi } from './wifi.tsx';

export const Network = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="text-base">{t('settings.network.title')}</div>
      <Divider className="opacity-50" />

      <div className="flex flex-col space-y-8">
        <Tls />
        <Wifi />
      </div>

      <Divider className="opacity-50" style={{ margin: '32px 0' }} />

      <DNS />
    </>
  );
};

import { useState } from 'react';
import { DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Card, Result } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/tailscale.ts';

type InstallProps = {
  setIsLocked: (setIsLocked: boolean) => void;
  onSuccess: () => void;
};

export const Install = ({ setIsLocked, onSuccess }: InstallProps) => {
  const { t } = useTranslation();

  const [state, setState] = useState('');

  function install() {
    if (state === 'installing') return;
    setState('installing');
    setIsLocked(true);

    api
      .install()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setState('failed');
          return;
        }

        onSuccess();
      })
      .finally(() => {
        setState('');
        setIsLocked(false);
      });
  }

  if (state === 'failed') {
    return (
      <Result
        status="warning"
        title={t('settings.tailscale.failed')}
        subTitle={t('settings.tailscale.retry')}
        icon={<InfoCircleOutlined />}
        extra={
          <Card key="tips" styles={{ body: { padding: 0 } }}>
            <ul className="list-decimal text-left font-mono text-sm text-neutral-300">
              <li>
                {t('settings.tailscale.download')}
                <a
                  className="px-1"
                  href="https://pkgs.tailscale.com/stable/tailscale_latest_riscv64.tgz"
                  target="_blank"
                >
                  {t('settings.tailscale.package')}
                </a>
                {t('settings.tailscale.unzip')}
              </li>
              <li>{t('settings.tailscale.upTailscale')}</li>
              <li>{t('settings.tailscale.upTailscaled')}</li>
              <li>{t('settings.tailscale.refresh')}</li>
            </ul>
          </Card>
        }
      />
    );
  }

  return (
    <Card>
      <Result
        icon={<DownloadOutlined />}
        subTitle={t('settings.tailscale.notInstall')}
        extra={
          <Button key="install" type="primary" loading={state === 'installing'} onClick={install}>
            {state === 'installing'
              ? t('settings.tailscale.installing')
              : t('settings.tailscale.install')}
          </Button>
        }
      />
    </Card>
  );
};

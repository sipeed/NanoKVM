import { useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { useTranslation } from 'react-i18next';

import { installTailscale } from '@/api/network.ts';

type InstallProps = {
  onSuccess: () => void;
};

export const Install = ({ onSuccess }: InstallProps) => {
  const { t } = useTranslation();

  const [isInstalling, setIsInstalling] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  function install() {
    if (isInstalling) return;
    setIsInstalling(true);

    installTailscale()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setIsFailed(true);
          return;
        }

        onSuccess();
      })
      .finally(() => {
        setIsInstalling(false);
      });
  }

  return (
    <>
      {!isFailed ? (
        <div className="flex h-full flex-col items-center justify-center space-y-7">
          <span>{t('tailscale.notInstall')}</span>

          <Button
            type="primary"
            size="large"
            shape="round"
            icon={<DownloadOutlined />}
            loading={isInstalling}
            onClick={install}
          >
            {isInstalling ? t('tailscale.installing') : t('tailscale.install')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-5 py-5">
          <div className="flex flex-col items-center justify-center">
            <span className="text-lg font-bold">{t('tailscale.failed')}</span>
            <span className="text-neutral-400">{t('tailscale.retry')}</span>
          </div>

          <Card>
            <ul className="list-decimal font-mono text-sm">
              <li>
                {t('tailscale.download')}
                <a
                  className="px-1"
                  href="https://pkgs.tailscale.com/stable/tailscale_latest_riscv64.tgz"
                  target="_blank"
                >
                  {t('tailscale.package')}
                </a>
                {t('tailscale.unzip')}
              </li>
              <li>{t('tailscale.upTailscale')}</li>
              <li>{t('tailscale.upTailscaled')}</li>
              <li>{t('tailscale.refresh')}</li>
            </ul>
          </Card>
        </div>
      )}
    </>
  );
};

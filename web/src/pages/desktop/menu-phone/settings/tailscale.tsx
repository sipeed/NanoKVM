import { useState } from 'react';
import { Button, Modal } from 'antd';
import { useSetAtom } from 'jotai';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network';
import { isSettingsOpenAtom } from '@/jotai/settings.ts';

type State = '' | 'installing' | 'installed' | 'failed';

export const Tailscale = () => {
  const { t } = useTranslation();
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [state, setState] = useState<State>('');
  const [loginUrl, setLoginUrl] = useState('');

  function openModal() {
    check();

    setIsModalOpen(true);
    setIsSettingsOpen(false);
  }

  function check() {
    if (['installing', 'installed'].includes(state)) return;

    if (isLoading) return;
    setIsLoading(true);

    api
      .getTailscale()
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        if (rsp.data.exist) {
          setState('installed');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function install() {
    if (state === 'installing') return;
    setState('installing');

    api
      .installTailscale()
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          setState('failed');
          return;
        }

        setState('installed');
      })
      .catch(() => {
        setState('failed');
      });
  }

  function run() {
    if (state !== 'installed') return;

    if (isStarting) return;
    setIsStarting(true);

    setLoginUrl('');

    api
      .runTailscale()
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        if (rsp.data.url) {
          updateLoginUrl(rsp.data.url);
        }
      })
      .finally(() => {
        setIsStarting(false);
      });
  }

  function updateLoginUrl(url: string) {
    setLoginUrl(url);

    window.open(url, '_blank');

    setTimeout(() => setLoginUrl(''), 10 * 60 * 1000);
  }

  return (
    <>
      <div
        className="flex cursor-pointer select-none items-center rounded px-3 py-1.5 hover:bg-neutral-600"
        onClick={openModal}
      >
        Tailscale
      </div>

      <Modal
        title="Tailscale"
        open={isModalOpen}
        width={350}
        footer={null}
        centered={true}
        maskClosable={false}
        onCancel={() => setIsModalOpen(false)}
      >
        <div className="flex h-[180px] items-center justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2 text-neutral-500">
              <LoaderCircleIcon className="animate-spin" size={18} />
              <span>{t('tailscale.loading')}</span>
            </div>
          ) : (
            <>
              {state === '' && (
                <div className="flex h-full flex-col items-center justify-center space-y-5">
                  <span>{t('tailscale.notInstalled')}</span>
                  <div className="flex justify-center">
                    <Button type="primary" onClick={install}>
                      {t('tailscale.install')}
                    </Button>
                  </div>
                </div>
              )}

              {state === 'installing' && (
                <div className="flex items-center justify-center space-x-2 text-neutral-500">
                  <LoaderCircleIcon className="animate-spin" size={18} />
                  <span>{t('tailscale.installing')}</span>
                </div>
              )}

              {state === 'installed' && (
                <div className="flex h-full flex-col items-center justify-center space-y-5">
                  {loginUrl ? (
                    <>
                      <a href={loginUrl} target="_blank">
                        {loginUrl}
                      </a>
                      <span className="text-sm text-neutral-400">{t('tailscale.urlPeriod')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('tailscale.installed')}</span>
                      <div className="flex justify-center">
                        <Button type="primary" loading={isStarting} onClick={run}>
                          {t('tailscale.login')}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {state === 'failed' && (
                <div className="flex flex-col space-y-10">
                  <div className="flex flex-col items-center justify-center font-bold text-neutral-400">
                    <span>{t('tailscale.failed')}</span>
                    <span>{t('tailscale.retry')}</span>
                  </div>

                  <ul className="list-decimal">
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
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

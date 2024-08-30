import { useState } from 'react';
import { Modal } from 'antd';
import { useSetAtom } from 'jotai/index';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getTailscaleStatus } from '@/api/network.ts';
import { isSettingsOpenAtom } from '@/jotai/settings.ts';

import { Device } from './device.tsx';
import { Install } from './install.tsx';
import { Login } from './login.tsx';

type Status = 'notInstall' | 'notLogin' | 'stopped' | 'running';

export const Tailscale = () => {
  const { t } = useTranslation();
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>('notInstall');
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [account, setAccount] = useState('');
  const [errMsg, setErrMsg] = useState('');

  function openModal() {
    getStatus();

    setIsModalOpen(true);
    setIsSettingsOpen(false);
  }

  function getStatus() {
    if (isLoading) return;
    setIsLoading(true);

    getTailscaleStatus()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        setStatus(rsp.data.status);
        setName(rsp.data.name);
        setIp(rsp.data.ip);
        setAccount(rsp.data.account);
      })
      .finally(() => {
        setIsLoading(false);
      });
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
        width={360}
        footer={null}
        centered={true}
        maskClosable={false}
        onCancel={() => setIsModalOpen(false)}
      >
        <div className="flex min-h-[200px] flex-col items-center justify-center space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2 text-neutral-500">
              <LoaderCircleIcon className="animate-spin" size={18} />
              <span>{t('tailscale.loading')}</span>
            </div>
          ) : status === 'notInstall' ? (
            <Install onSuccess={getStatus} />
          ) : status === 'notLogin' ? (
            <Login onSuccess={getStatus} />
          ) : (
            <Device status={status} ip={ip} account={account} name={name} setStatus={setStatus} />
          )}

          {errMsg && <span className="text-red-500">{errMsg}</span>}
        </div>
      </Modal>
    </>
  );
};

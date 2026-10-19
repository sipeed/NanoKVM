import { useRef, useState } from 'react';
import { Modal } from 'antd';
import { Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/netbird.ts';

type UninstallProps = {
  onSuccess: () => void;
};

export const Uninstall = ({ onSuccess }: UninstallProps) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  // React state does not update synchronously. Keep the request lock in a ref
  // as well so a rapid second confirmation or a close event cannot slip
  // through before the loading render has committed.
  const uninstallInFlight = useRef(false);
  function uninstall() {
    if (uninstallInFlight.current) return;
    uninstallInFlight.current = true;
    setIsLoading(true);
    setErrMsg('');

    api
      .uninstall()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg || 'Uninstall failed');
          return;
        }

        setIsModalOpen(false);
        // Only a confirmed success is safe to refresh. On a rejected request
        // or a transport failure the server may have stopped or partly removed
        // NetBird; keep this modal and its error visible for recovery.
        onSuccess();
      })
      .catch((err) => {
        setErrMsg(err.message || 'Uninstall failed');
      })
      .finally(() => {
        uninstallInFlight.current = false;
        setIsLoading(false);
      });
  }

  const title = (
    <div className="flex items-center space-x-1 text-red-500">
      <Trash2Icon size={18} />
      <span>{t('settings.netbird.uninstall')}</span>
    </div>
  );

  return (
    <>
      <div
        className="flex h-[30px] cursor-pointer items-center space-x-1 rounded px-2 py-1 text-neutral-300 hover:bg-neutral-700/70"
        onClick={() => setIsModalOpen(true)}
      >
        <span>{t('settings.netbird.uninstall')}</span>
      </div>

      <Modal
        title={title}
        open={isModalOpen}
        centered={true}
        okType="danger"
        okText={t('settings.netbird.okBtn')}
        cancelText={t('settings.netbird.cancelBtn')}
        onOk={uninstall}
        // A failed uninstall can leave a partial device state. Do not allow the
        // result to disappear into a closed modal while that request is still
        // in flight; after it resolves, the user can see and act on its error.
        onCancel={() => {
          if (!uninstallInFlight.current) setIsModalOpen(false);
        }}
        confirmLoading={isLoading}
        cancelButtonProps={{ disabled: isLoading }}
        closable={!isLoading}
        keyboard={!isLoading}
        maskClosable={!isLoading}
      >
        <div className="py-5">
          <p className="text-base">{t('settings.netbird.uninstallDesc')}</p>
          <p className="pt-2 text-sm text-neutral-400">{t('settings.netbird.uninstallWarning')}</p>
          {errMsg && <p className="pt-3 text-sm text-red-500">{errMsg}</p>}
        </div>
      </Modal>
    </>
  );
};

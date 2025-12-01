import { useState } from 'react';
import { Modal } from 'antd';
import { Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/tailscale.ts';

type UninstallProps = {
  onSuccess: () => void;
};

export const Uninstall = ({ onSuccess }: UninstallProps) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function uninstall() {
    if (isLoading) return;
    setIsLoading(true);

    api.uninstall().finally(() => {
      setIsModalOpen(false);
      setIsLoading(false);
      onSuccess();
    });
  }

  const title = (
    <div className="flex items-center space-x-1 text-red-500">
      <Trash2Icon size={18} />
      <span>{t('settings.tailscale.uninstall')}</span>
    </div>
  );

  return (
    <>
      <div
        className="flex h-[30px] cursor-pointer items-center space-x-1 rounded px-2 py-1 text-neutral-300 hover:bg-neutral-700/70"
        onClick={() => setIsModalOpen(true)}
      >
        <span>{t('settings.tailscale.uninstall')}</span>
      </div>

      <Modal
        title={title}
        open={isModalOpen}
        okType="danger"
        okText={t('settings.tailscale.okBtn')}
        cancelText={t('settings.tailscale.cancelBtn')}
        onOk={uninstall}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={isLoading}
      >
        <div className="py-5">
          <p className="text-base">{t('settings.tailscale.uninstallDesc')}</p>
        </div>
      </Modal>
    </>
  );
};

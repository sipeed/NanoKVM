import { useState } from 'react';
import { Button, Modal, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export const Tips = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <span
        className="cursor-pointer text-neutral-500 underline underline-offset-4"
        onClick={showModal}
      >
        {t('auth.forgetPassword')}
      </span>

      <Modal
        title={t('auth.resetPassword')}
        open={isModalOpen}
        onCancel={hideModal}
        closeIcon={null}
        footer={null}
        centered={true}
      >
        <div className="flex flex-col space-y-1 pt-1">
          <div>{t('auth.reset1')}</div>
          <div>{t('auth.reset2')}</div>
          <div>
            {t('auth.reset3')}
            <Text code={true}>/etc/kvm/pwd</Text>
          </div>
          <div>
            {t('auth.reset4')}
            <Text code={true}>admin/admin</Text>
          </div>
        </div>

        <div className="flex justify-center pb-3 pt-10">
          <Button type="primary" className="w-24" onClick={hideModal}>
            {t('auth.ok')}
          </Button>
        </div>
      </Modal>
    </>
  );
};

import { useState } from 'react';
import { Button, Card, Modal, Typography } from 'antd';
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
        className="cursor-pointer text-neutral-300 underline underline-offset-4"
        onClick={showModal}
      >
        {t('auth.forgetPassword')}
      </span>

      <Modal
        title={t('auth.forgetPassword')}
        open={isModalOpen}
        onCancel={hideModal}
        closeIcon={null}
        footer={null}
        centered={true}
      >
        <Card style={{ marginTop: '20px' }}>
          <div className="flex w-[430px] flex-col space-y-5">
            <div>{t('auth.tips.reset1')}</div>

            <div className="flex items-center space-x-1">
              <span>{t('auth.tips.reset2')}</span>
              <a href="https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/reset.html" target="_blank">
                wiki
              </a>
            </div>

            <ul className="list-outside list-disc">
              <li>
                {t('auth.tips.reset3')}
                <Text code={true}>admin/admin</Text>
              </li>
              <li>
                {t('auth.tips.reset4')}
                <Text code={true}>root/root</Text>
              </li>
            </ul>
          </div>
        </Card>

        <div className="flex justify-center pb-3 pt-10">
          <Button type="primary" className="w-24" onClick={hideModal}>
            {t('auth.ok')}
          </Button>
        </div>
      </Modal>
    </>
  );
};

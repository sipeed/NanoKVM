import { useEffect, useState } from 'react';
import { Button, Divider, Modal, Typography } from 'antd';
import clsx from 'clsx';
import { PenIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/hid.ts';

const { Paragraph } = Typography;

export const HidMode = () => {
  const { t } = useTranslation();

  const [hidMode, setHidMode] = useState<'normal' | 'hid-only'>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    getHidMode();
  }, []);

  function getHidMode() {
    setIsLoading(true);

    api
      .getHidMode()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        setHidMode(rsp.data.mode);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function updateHidMode() {
    if (isLoading) return;
    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      window.location.reload();
    }, 30000);

    const mode = hidMode === 'normal' ? 'hid-only' : 'normal';

    api
      .setHidMode(mode)
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          setIsLoading(false);
          clearTimeout(timeoutId);
        }
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
        clearTimeout(timeoutId);
      });
  }

  return (
    <>
      <div
        className={clsx(
          'flex h-[30px] cursor-pointer select-none items-center space-x-2 rounded px-3 hover:bg-neutral-700/70',
          hidMode === 'hid-only' ? 'text-blue-500' : 'text-neutral-300'
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <PenIcon size={18} />
        <span>{t('mouse.hidOnly.title')}</span>
      </div>

      <Modal
        open={isModalOpen}
        title={t('mouse.hidOnly.title')}
        width={580}
        centered={false}
        footer={false}
        onCancel={() => setIsModalOpen(false)}
      >
        <Divider />

        <Paragraph>{t('mouse.hidOnly.desc')}</Paragraph>

        <Paragraph type="secondary">
          <ul>
            <li>{t('mouse.hidOnly.tip1')}</li>
            <li>{t('mouse.hidOnly.tip2')}</li>
            <li>{t('mouse.hidOnly.tip3')}</li>
          </ul>
        </Paragraph>

        {errMsg && <div className="pt-1 text-sm text-red-500">{errMsg}</div>}

        <div className="flex justify-center pt-5">
          <Button danger type="primary" loading={isLoading} onClick={updateHidMode}>
            {hidMode === 'normal' ? t('mouse.hidOnly.enable') : t('mouse.hidOnly.disable')}
          </Button>
        </div>
      </Modal>
    </>
  );
};

import { useEffect, useState } from 'react';
import { Button, Divider, Modal, Select, Typography } from 'antd';
import clsx from 'clsx';
import { PenIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/hid.ts';

const { Paragraph } = Typography;

export const HidMode = () => {
  const { t } = useTranslation();

  const [hidMode, setHidMode] = useState<'normal' | 'hid-only' | 'kbd-only' | 'no-hid'>('normal');
  const [toggleMode, setToggleMode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const ModeOptions = [
    { value: 'normal', label: t('mouse.hidMode.normal') },
    { value: 'hid-only', label: t('mouse.hidMode.hidonly') },
    { value: 'kbd-only', label: t('mouse.hidMode.kbdonly') },
    { value: 'no-hid', label: t('mouse.hidMode.nohid') },
  ];

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
    if (hidMode === toggleMode || toggleMode === '') {
      setIsModalOpen(false);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      window.location.reload();
    }, 30000);

    const mode = toggleMode;

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
          hidMode === 'hid-only' ? 'text-blue-500' : hidMode === 'kbd-only' ? 'text-blue-500' : hidMode === 'no-hid' ? 'text-yellow-400' : 'text-neutral-300'
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <PenIcon size={18} />
        <span>{t('mouse.hidMode.title')}</span>
      </div>

      <Modal
        open={isModalOpen}
        title={t('mouse.hidMode.title')}
        width={580}
        centered={false}
        footer={false}
        onCancel={() => setIsModalOpen(false)}
      >
        <Divider />

        <Paragraph>{t('mouse.hidMode.desc')}</Paragraph>

        <Paragraph type="secondary">
          <ul>
            <li>{t('mouse.hidMode.tip1')}</li>
            <li>{t('mouse.hidMode.tip2')}</li>
            <li>{t('mouse.hidMode.tip3')}</li>
          </ul>
        </Paragraph>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <PenIcon size={16} />
            <span>{t('mouse.hidMode.title')}</span>
          </div>

          <Select
            defaultValue={hidMode}
            style={{ width: 180 }}
            options={ModeOptions}
            onSelect={setToggleMode}
          />
        </div>

        {errMsg && <div className="pt-1 text-sm text-red-500">{errMsg}</div>}

        <div className="flex justify-center pt-5">
          <Button danger type="primary" loading={isLoading} onClick={updateHidMode}>
            {hidMode === toggleMode ? t('mouse.hidMode.close') : toggleMode === '' ? t('mouse.hidMode.close') : t('mouse.hidMode.enable')}
          </Button>
        </div>
      </Modal>
    </>
  );
};

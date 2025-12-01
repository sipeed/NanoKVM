import { useEffect, useState } from 'react';
import { Divider, Modal, Segmented } from 'antd';
import clsx from 'clsx';
import { DiscIcon, HardDriveIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/storage.ts';

import { Images } from './images.tsx';
import { Tips } from './tips.tsx';

export const Image = () => {
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState('mass-storage');

  const modes = [
    {
      value: 'mass-storage',
      label: (
        <div className="flex items-center space-x-1">
          <HardDriveIcon size={16} />
          <span>Mass Storage</span>
        </div>
      )
    },
    {
      value: 'cd-rom',
      label: (
        <div className="flex items-center space-x-1">
          <DiscIcon size={16} />
          <span>CD ROM</span>
        </div>
      )
    }
  ];

  useEffect(() => {
    api.getMountedImage().then((rsp) => {
      if (rsp.code === 0) {
        setIsMounted(!!rsp.data?.file);
      }
    });

    api.getCdRom().then((rsp) => {
      if (rsp.code === 0) {
        setMode(rsp.data?.cdrom === 1 ? 'cd-rom' : 'mass-storage');
      }
    });
  }, []);

  return (
    <>
      <div
        className={clsx(
          'flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded hover:bg-neutral-700',
          isMounted ? 'text-blue-500' : 'text-neutral-300 hover:text-white'
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <DiscIcon size={18} />
      </div>

      <Modal open={isModalOpen} footer={null} onCancel={() => setIsModalOpen(false)}>
        <div className="flex items-center space-x-1">
          <span className="text-xl font-bold">{t('image.title')}</span>
          <Tips />
        </div>

        <Divider style={{ margin: '24px 0' }} />

        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <span>{t('image.mountMode')}</span>
            <Segmented value={mode} options={modes} disabled={isMounted} onChange={setMode} />
          </div>

          <Divider style={{ margin: '24px 0 0 0' }} />

          <Images isOpen={isModalOpen} cdrom={mode === 'cd-rom'} setIsMounted={setIsMounted} />
        </div>
      </Modal>
    </>
  );
};

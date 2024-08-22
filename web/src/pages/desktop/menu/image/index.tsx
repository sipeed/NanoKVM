import { useEffect, useState } from 'react';
import { Divider, Popover } from 'antd';
import clsx from 'clsx';
import { DiscIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getMountedImage } from '@/api/storage.ts';

import { Images } from './images.tsx';
import { Tips } from './tips.tsx';

export const Image = () => {
  const { t } = useTranslation();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    getMountedImage().then((rsp) => {
      if (rsp.code !== 0) return;
      setIsMounted(!!rsp.data?.file);
    });
  }, []);

  const content = (
    <div className="min-w-[300px]">
      <div className="flex items-center justify-between px-1">
        <span className="text-base font-bold text-neutral-300">{t('image.title')}</span>
        <Tips />
      </div>

      <Divider style={{ margin: '10px 0 15px 0' }} />

      {isPopoverOpen && <Images setIsMounted={setIsMounted} />}
    </div>
  );

  return (
    <Popover
      content={content}
      placement="bottomLeft"
      trigger="click"
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      <div
        className={clsx(
          'flex h-[30px] cursor-pointer items-center justify-center rounded px-2 hover:bg-neutral-700',
          isMounted ? 'text-blue-500' : 'text-neutral-300'
        )}
      >
        <DiscIcon size={18} />
      </div>
    </Popover>
  );
};

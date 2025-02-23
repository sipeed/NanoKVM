import { useEffect, useRef, useState } from 'react';
import { Button, Divider, Popover, Switch, Tooltip } from 'antd';
import clsx from 'clsx';
import { DiscIcon, RefreshCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';

import { getCdRom, getMountedImage } from '@/api/storage.ts';

import { Images } from './images.tsx';
import { Tips } from './tips.tsx';

export const Image = () => {
  const { t } = useTranslation();
  const isBigScreen = useMediaQuery({ minWidth: 640 });

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cdrom, setCdrom] = useState(false);

  const getImagesRef = useRef<() => void>(() => {});

  useEffect(() => {
    getMountedImage().then((rsp) => {
      if (rsp.code !== 0) return;
      setIsMounted(!!rsp.data?.file);
    });

    getCdRom().then((rsp) => {
      if (rsp.code !== 0) return;
      setCdrom(rsp.data?.cdrom === 1);
    });
  }, []);

  const refreshImages = () => {
    if (getImagesRef.current) {
      getImagesRef.current();
    }
  };

  const content = (
    <div className="min-w-[300px]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-1">
          <span className="text-base font-bold text-neutral-300">{t('image.title')}</span>
          <Tips />
        </div>

        <div className="flex items-center space-x-2">
          <Tooltip title={t('image.cdrom')} placement="bottom">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-neutral-400">CD-ROM</span>

              <Switch size="small" checked={cdrom} onChange={(checked) => setCdrom(checked)}></Switch>
            </div>
          </Tooltip>

          <Tooltip title={t('image.refresh')} placement="bottom">
            <Button type="default" icon={<RefreshCwIcon size={16} />} onClick={refreshImages} />
          </Tooltip>
        </div>
      </div>

      <Divider style={{ margin: '10px 0 15px 0' }} />

      {isPopoverOpen && (
        <Images cdrom={cdrom} setIsMounted={setIsMounted} onRefresh={(callback) => (getImagesRef.current = callback)} />
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      placement={isBigScreen ? 'bottomLeft' : 'bottom'}
      trigger="click"
      arrow={false}
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      <div
        className={clsx(
          'flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded hover:bg-neutral-700',
          isMounted ? 'text-blue-500' : 'text-neutral-300 hover:text-white'
        )}
      >
        <DiscIcon size={18} />
      </div>
    </Popover>
  );
};

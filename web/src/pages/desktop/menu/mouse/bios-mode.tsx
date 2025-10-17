import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { MonitorCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/hid.ts';

export const BiosMode = () => {
  const { t } = useTranslation();
  const [biosMode, setBiosMode] = useState<'normal' | 'bios'>('normal');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getBiosMode();
  }, []);

  function getBiosMode() {
    setIsLoading(true);

    api
      .getBiosMode()
      .then((rsp) => {
        if (rsp.code !== 0) {
          return;
        }

        setBiosMode(rsp.data.mode);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function updateBiosMode() {
    if (isLoading) return;
    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      window.location.reload();
    }, 5000);

    const mode = biosMode === 'normal' ? 'bios' : 'normal';

    api
      .setBiosMode(mode)
      .then((rsp) => {
        if (rsp.code !== 0) {
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
          biosMode === 'bios' ? 'text-blue-500' : 'text-neutral-300'
        )}
        onClick={updateBiosMode}
      >
        <MonitorCog className={clsx({ 'animate-spin text-blue-500': isLoading })} size={18} />
        <span>{t('mouse.biosHid')}</span>
      </div>
    </>
  );
};

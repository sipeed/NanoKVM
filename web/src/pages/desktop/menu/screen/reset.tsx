import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { RefreshCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

export const Reset = () => {
  const { t } = useTranslation();

  const [isPcie, setIsPcie] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    api.getHardware().then((rsp) => {
      if (rsp.code === 0) {
        setIsPcie(rsp.data?.version === 'PCIE');
      }
    });
  }, []);

  function reset() {
    if (isResetting) return;
    setIsResetting(true);

    api.resetHdmi().finally(() => {
      setTimeout(() => {
        setIsResetting(false);
      }, 1000);
    });
  }

  return (
    <>
      {isPcie && (
        <div
          className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700/70"
          onClick={reset}
        >
          <RefreshCwIcon
            className={clsx({ 'animate-spin text-blue-500': isResetting })}
            size={18}
          />
          <span className="select-none text-sm">{t('screen.resetHdmi')}</span>
        </div>
      )}
    </>
  );
};

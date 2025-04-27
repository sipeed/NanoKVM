import { useState } from 'react';
import clsx from 'clsx';
import { RefreshCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/hid.ts';
import { client } from '@/lib/websocket.ts';

export const ResetHid = () => {
  const { t } = useTranslation();

  const [isResetting, setIsResetting] = useState(false);

  function resetHid() {
    if (isResetting) return;
    setIsResetting(true);

    client.send([1, 0, 0, 0, 0, 0]);
    client.close();

    api.reset().finally(() => {
      client.connect();
      setIsResetting(false);
    });
  }

  return (
    <div
      className="flex h-[30px] cursor-pointer select-none items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700/70"
      onClick={resetHid}
    >
      <RefreshCwIcon className={clsx({ 'animate-spin text-blue-500': isResetting })} size={18} />
      <span>{t('mouse.resetHid')}</span>
    </div>
  );
};

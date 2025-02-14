import { useState } from 'react';
import { Button } from 'antd';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/tailscale.ts';

type UninstallProps = {
  onSuccess: () => void;
};

export const Uninstall = ({ onSuccess }: UninstallProps) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmation, setIsConfirmation] = useState(false);

  function showConfirmation() {
    if (!isConfirmation) {
      setIsConfirmation(true);
    }
  }

  function uninstall() {
    if (isLoading) return;
    setIsLoading(true);

    api.uninstall().finally(() => {
      setIsLoading(false);
      onSuccess();
    });
  }

  return (
    <div
      className="flex h-[40px] cursor-pointer items-center justify-between space-x-6 rounded px-3 text-neutral-300 hover:bg-neutral-700/70"
      onClick={showConfirmation}
    >
      <span className={clsx(isConfirmation && 'text-red-500')}>
        {t('settings.tailscale.uninstall')}
      </span>

      {isConfirmation && (
        <div className="flex items-center space-x-2">
          <Button type="primary" size="small" disabled={isLoading} danger onClick={uninstall}>
            {t('settings.tailscale.okBtn')}
          </Button>

          <Button type="primary" size="small" onClick={() => setIsConfirmation(false)}>
            {t('settings.tailscale.cancelBtn')}
          </Button>
        </div>
      )}
    </div>
  );
};

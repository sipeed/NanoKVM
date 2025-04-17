import { Popconfirm } from 'antd';
import { RotateCcwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { setGpio } from '@/api/vm.ts';

type ResetProps = {
  showConfirm: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

export const Reset = ({ showConfirm, isLoading, setIsLoading }: ResetProps) => {
  const { t } = useTranslation();

  function reset() {
    if (isLoading) return;
    setIsLoading(true);

    setGpio('reset', 800).finally(() => {
      setIsLoading(false);
    });
  }

  return (
    <>
      {showConfirm ? (
        <Popconfirm
          placement="bottomLeft"
          title={t('power.resetConfirm')}
          okText={t('power.okBtn')}
          cancelText={t('power.cancelBtn')}
          onConfirm={reset}
          color="#404040"
        >
          <div className="flex cursor-pointer select-none items-center space-x-2 rounded px-3 py-1.5 hover:bg-neutral-700/70">
            <RotateCcwIcon size={16} />
            <span>{t('power.reset')}</span>
          </div>
        </Popconfirm>
      ) : (
        <div
          className="flex cursor-pointer select-none items-center space-x-2 rounded px-3 py-1.5 hover:bg-neutral-700/70"
          onClick={reset}
        >
          <RotateCcwIcon size={16} />
          <span>{t('power.reset')}</span>
        </div>
      )}
    </>
  );
};

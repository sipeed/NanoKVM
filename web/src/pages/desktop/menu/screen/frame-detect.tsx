import { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import clsx from 'clsx';
import { LoaderCircleIcon, Tally4Icon, Tally5Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/stream.ts';
import * as ls from '@/lib/localstorage.ts';

export const FrameDetect = () => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const enabled = ls.getFrameDetect();
    if (enabled) {
      setIsEnabled(true);
    } else {
      api.updateFrameDetect(false);
    }
  }, []);

  function update() {
    if (isLoading) return;
    setIsLoading(true);

    const enabled = !isEnabled;

    api
      .updateFrameDetect(enabled)
      .then((rsp) => {
        if (rsp.code === 0) {
          setIsEnabled(enabled);
          ls.setFrameDetect(enabled);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <Tooltip placement="rightTop" title={t('screen.frameDetectTip')} color="#262626" arrow>
      <div
        className="group flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700"
        onClick={update}
      >
        {isLoading ? (
          <LoaderCircleIcon className="animate-spin" size={18} />
        ) : (
          <>
            {isEnabled ? <Tally4Icon color="#22c55e" size={18} /> : <Tally5Icon size={18} />}

            <span
              className={clsx(
                'select-none text-sm',
                isEnabled ? 'group-hover:text-red-500' : 'group-hover:text-green-500'
              )}
            >
              {t('screen.frameDetect')}
            </span>
          </>
        )}
      </div>
    </Tooltip>
  );
};

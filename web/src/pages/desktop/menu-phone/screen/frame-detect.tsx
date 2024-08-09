import { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import { LoaderCircleIcon, Tally4Icon, Tally5Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getFrameDetect, updateFrameDetect } from '@/api/stream.ts';

export const FrameDetect = () => {
  const { t } = useTranslation();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getFrameDetect().then((rsp) => {
      if (rsp.code === 0) {
        setIsEnabled(rsp.data.enabled);
      }
    });
  }, []);

  function update() {
    if (isLoading) return;
    setIsLoading(true);

    updateFrameDetect()
      .then((rsp) => {
        if (rsp.code === 0) {
          setIsEnabled(rsp.data.enabled);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <Tooltip placement="rightTop" title={t('screen.frameDetectTip')} color="#262626" arrow>
      <div
        className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700"
        onClick={update}
      >
        {isLoading ? (
          <LoaderCircleIcon className="animate-spin" size={18} />
        ) : isEnabled ? (
          <Tally4Icon color="#22c55e" size={18} />
        ) : (
          <Tally5Icon size={18} />
        )}
        <span className="select-none text-sm">{t('screen.frameDetect')}</span>
      </div>
    </Tooltip>
  );
};

import { Popover } from 'antd';
import { useAtomValue } from 'jotai';
import { CheckIcon, SquareActivityIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { updateScreen } from '@/api/vm';
import { setQuality as setCookie } from '@/lib/localstorage.ts';
import { videoModeAtom } from '@/jotai/screen.ts';

import { BitRateMap, QualityMap } from './constants.ts';

type QualityProps = {
  quality: number;
  setQuality: (quality: number) => void;
};

export const Quality = ({ quality, setQuality }: QualityProps) => {
  const { t } = useTranslation();
  const videoMode = useAtomValue(videoModeAtom);

  const qualityList = [
    { key: 1, label: t('screen.qualityLossless') },
    { key: 2, label: t('screen.qualityHigh') },
    { key: 3, label: t('screen.qualityMedium') },
    { key: 4, label: t('screen.qualityLow') }
  ];

  async function update(key: number) {
    const value = videoMode === 'mjpeg' ? QualityMap.get(key)! : BitRateMap.get(key)!;

    const rsp = await updateScreen('quality', value);
    if (rsp.code !== 0) {
      return;
    }

    setQuality(key);
    setCookie(key);
  }

  const content = (
    <>
      {qualityList.map((item) => (
        <div
          key={item.key}
          className="flex h-[30px] cursor-pointer select-none items-center space-x-1 rounded pl-1 pr-5 hover:bg-neutral-600"
          onClick={() => update(item.key)}
        >
          <div className="flex h-[14px] w-[20px] items-end">
            {item.key === quality && <CheckIcon size={14} />}
          </div>
          <span className="flex w-[40px]">{item.label}</span>
        </div>
      ))}
    </>
  );

  return (
    <Popover content={content} placement="rightTop">
      <div className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700">
        <SquareActivityIcon size={18} />
        <span className="select-none text-sm">{t('screen.quality')}</span>
      </div>
    </Popover>
  );
};

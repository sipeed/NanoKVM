import { ReactElement, useEffect } from 'react';
import { Popover } from 'antd';
import { useAtom } from 'jotai';
import { CheckIcon, PercentIcon, ScalingIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as storage from '@/lib/localstorage.ts';
import { videoScaleAtom } from '@/jotai/screen.ts';

const ScaleList = [
  { label: '200', value: 2 },
  { label: '150', value: 1.5 },
  { label: '100', value: 1 },
  { label: '75', value: 0.75 },
  { label: '50', value: 0.5 }
];

export const Scale = (): ReactElement => {
  const { t } = useTranslation();

  const [videoScale, setVideoScale] = useAtom(videoScaleAtom);

  useEffect(() => {
    const scale = storage.getVideoScale();
    if (scale) {
      setVideoScale(scale);
    }
  }, [setVideoScale]);

  async function update(scale: number): Promise<void> {
    setVideoScale(scale);
    storage.setVideoScale(scale);
  }

  const content = (
    <>
      {ScaleList.map((scale) => (
        <div
          key={scale.value}
          className="flex h-[30px] cursor-pointer select-none items-center rounded pl-1 pr-5 hover:bg-neutral-700/70"
          onClick={() => update(scale.value)}
        >
          <div className="flex h-[14px] w-[20px] items-end text-blue-500">
            {scale.value === videoScale && <CheckIcon size={14} />}
          </div>
          <div className="flex items-center space-x-0.5">
            <span>{scale.label}</span>
            <PercentIcon size={12} />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <Popover content={content} placement="rightTop" arrow={false} align={{ offset: [13, 0] }}>
      <div className="flex h-[30px] cursor-pointer items-center space-x-1 rounded px-3 text-neutral-300 hover:bg-neutral-700/50">
        <div className="flex h-[14px] w-[20px] items-end">
          <ScalingIcon size={16} />
        </div>
        <span>{t('screen.scale')}</span>
      </div>
    </Popover>
  );
};

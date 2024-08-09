import { Popover } from 'antd';
import { CheckIcon, SquareActivityIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { updateScreen } from '@/api/vm';
import { setQuality as setCookie } from '@/lib/localstorage.ts';

const qualityList = [
  { key: 99, label: '100%' },
  { key: 90, label: '90%' },
  { key: 80, label: '80%' },
  { key: 70, label: '70%' },
  { key: 60, label: '60%' },
  { key: 51, label: '50%' }
];

type QualityProps = {
  quality: number;
  setQuality: (quality: number) => void;
};

export const Quality = ({ quality, setQuality }: QualityProps) => {
  const { t } = useTranslation();

  async function update(value: number) {
    const rsp = await updateScreen('quality', value);

    if (rsp.code !== 0) {
      return;
    }

    setQuality(value);
    setCookie(value);
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
          <span className="flex w-[32px]">{item.label}</span>
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

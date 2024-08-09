import { Popover } from 'antd';
import { useAtom } from 'jotai';
import { CheckIcon, RatioIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { updateScreen } from '@/api/vm';
import { Resolution as TypeResolution } from '@/types';
import { setResolution as setCookie } from '@/lib/localstorage';
import { resolutionAtom } from '@/jotai/resolution.ts';

const resolutions: TypeResolution[] = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 800, height: 600 },
  { width: 640, height: 480 }
];

export const Resolution = () => {
  const { t } = useTranslation();
  const [resolution, setResolution] = useAtom(resolutionAtom);

  async function update(item: TypeResolution) {
    const rsp = await updateScreen('resolution', item.height);
    if (rsp.code !== 0) {
      return;
    }

    setResolution(item);
    setCookie(item);
  }

  const content = (
    <>
      {resolutions.map((item) => (
        <div
          key={item.height}
          className="flex cursor-pointer select-none items-center space-x-1 rounded py-1.5 pl-1 pr-5 hover:bg-neutral-600"
          onClick={() => update(item)}
        >
          <div className="flex h-[14px] w-[20px] items-end">
            {item.height === resolution?.height && <CheckIcon size={14} />}
          </div>
          <span className="flex w-[32px]">{item.width}</span>
          <span>x</span>
          <span className="w-[36px]">{item.height}</span>
        </div>
      ))}
    </>
  );

  return (
    <Popover content={content} placement="rightTop">
      <div className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700">
        <RatioIcon size={18} />
        <span className="select-none text-sm">{t('screen.resolution')}</span>
      </div>
    </Popover>
  );
};

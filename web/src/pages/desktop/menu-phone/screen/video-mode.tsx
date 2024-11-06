import { Popover } from 'antd';
import { useAtomValue } from 'jotai';
import { CheckIcon, TvMinimalPlayIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { setVideoMode as setCookie } from '@/lib/localstorage.ts';
import { videoModeAtom } from '@/jotai/screen.ts';

const videoModes = [
  { key: 'h264', name: 'H.264' },
  { key: 'mjpeg', name: 'MJPEG' }
];

export const VideoMode = () => {
  const { t } = useTranslation();
  const videoMode = useAtomValue(videoModeAtom);

  function update(mode: string) {
    if (mode === videoMode) return;

    setCookie(mode);

    // reload after changing video mode
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  const content = (
    <>
      {videoModes.map((mode) => (
        <div
          key={mode.key}
          className="flex cursor-pointer select-none items-center space-x-1 rounded py-1.5 pl-1 pr-5 hover:bg-neutral-600"
          onClick={() => update(mode.key)}
        >
          <div className="flex h-[14px] w-[20px] items-end">
            {mode.key === videoMode && <CheckIcon size={15} />}
          </div>

          <span className="flex w-[50px]">{mode.name}</span>
        </div>
      ))}
    </>
  );

  return (
    <Popover content={content} placement="rightTop">
      <div className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700">
        <TvMinimalPlayIcon size={18} />
        <span className="select-none text-sm">{t('screen.video')}</span>
      </div>
    </Popover>
  );
};

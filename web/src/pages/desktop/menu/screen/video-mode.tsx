import { useEffect, useState } from 'react';
import { Popover, Tooltip } from 'antd';
import { useAtomValue } from 'jotai';
import { CheckIcon, TvMinimalPlayIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { setVideoMode as setCookie } from '@/lib/localstorage.ts';
import { videoModeAtom } from '@/jotai/screen.ts';

const videoModes = [
  { key: 'direct', name: 'H.264 (Direct)' },
  { key: 'h264', name: 'H.264 (WebRTC)' },
  { key: 'mjpeg', name: 'MJPEG' }
];

export const VideoMode = () => {
  const { t } = useTranslation();
  const videoMode = useAtomValue(videoModeAtom);

  const [isDirectSupported, setIsDirectSupported] = useState(false);

  useEffect(() => {
    const isHttps = window.location.protocol === 'https:';
    const isDecoderSupported = !!window.VideoDecoder;

    setIsDirectSupported(isHttps && isDecoderSupported);
  }, []);

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
      {!isDirectSupported && (
        <Tooltip
          title={t('screen.videoDirectTips')}
          placement="right"
          styles={{ root: { maxWidth: '270px' } }}
        >
          <div className="flex cursor-not-allowed select-none items-center rounded py-1.5 pl-1 pr-5 text-neutral-500 hover:bg-neutral-700/70">
            <div className="flex h-[14px] w-[20px] items-end text-blue-500"></div>
            <span>H.264 (Direct)</span>
          </div>
        </Tooltip>
      )}

      {videoModes.map(
        (mode) =>
          (isDirectSupported || mode.key !== 'direct') && (
            <div
              key={mode.key}
              className="flex cursor-pointer select-none items-center rounded py-1.5 pl-1 pr-5 hover:bg-neutral-700/70"
              onClick={() => update(mode.key)}
            >
              <div className="flex h-[14px] w-[20px] items-end text-blue-500">
                {mode.key === videoMode && <CheckIcon size={15} />}
              </div>
              <span>{mode.name}</span>
            </div>
          )
      )}
    </>
  );

  return (
    <Popover content={content} placement="rightTop" arrow={false} align={{ offset: [14, 0] }}>
      <div className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700/70">
        <TvMinimalPlayIcon size={18} />
        <span className="select-none text-sm">{t('screen.video')}</span>
      </div>
    </Popover>
  );
};

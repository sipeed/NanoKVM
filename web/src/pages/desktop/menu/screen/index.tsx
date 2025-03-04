import { useEffect, useState } from 'react';
import { Popover, Tooltip } from 'antd';
import { useAtomValue } from 'jotai';
import { MonitorIcon } from 'lucide-react';

import { updateScreen } from '@/api/vm';
import * as ls from '@/lib/localstorage';
import { resolutionAtom, videoModeAtom } from '@/jotai/screen.ts';

import { BitRateMap, QualityMap } from './constants.ts';
import { Fps } from './fps';
import { FrameDetect } from './frame-detect';
import { Quality } from './quality';
import { Reset } from './reset.tsx';
import { Resolution } from './resolution';
import { VideoMode } from './video-mode.tsx';
import { t } from 'i18next';

export const Screen = () => {
  const videoMode = useAtomValue(videoModeAtom);
  const resolution = useAtomValue(resolutionAtom);
  const [fps, setFps] = useState(30);
  const [quality, setQuality] = useState(2);

  const tooltip = t('screen.title');
  const [tooltipValue, setTooltipValue] = useState(tooltip);

  useEffect(() => {
    updateScreen('type', videoMode === 'mjpeg' ? 0 : 1);
    updateScreen('resolution', resolution!.height);
    updateQuality();
    updateFps();
  }, []);

  function updateQuality() {
    const cookieQuality = ls.getQuality();
    if (!cookieQuality) return;

    const key = cookieQuality >= 1 && cookieQuality <= 4 ? cookieQuality : 2;
    const value = videoMode === 'mjpeg' ? QualityMap.get(key)! : BitRateMap.get(key)!;

    updateScreen('quality', value).then((rsp) => {
      if (rsp.code === 0) {
        setQuality(key);
      }
    });
  }

  function updateFps() {
    const cookieFps = ls.getFps();
    if (!cookieFps) return;

    updateScreen('fps', cookieFps).then((rsp) => {
      if (rsp.code === 0) {
        setFps(cookieFps);
      }
    });
  }

  return (
    <Popover
      content={
        <div className="flex flex-col space-y-1">
          <VideoMode />
          <Resolution />
          <Quality quality={quality} setQuality={setQuality} />
          <Fps fps={fps} setFps={setFps} />
          {videoMode === 'mjpeg' && <FrameDetect />}
          <Reset />
        </div>
      }
      placement="bottomLeft"
      trigger="click"
      arrow={false}
      onOpenChange={(visible) => setTooltipValue(visible ? '' : tooltip)}
    >
      <Tooltip title={tooltipValue}>
        <div className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700 hover:text-white">
          <MonitorIcon size={18} />
        </div>
      </Tooltip>
    </Popover>
  );
};

import { useEffect, useState } from 'react';
import { Popover } from 'antd';
import { useAtomValue } from 'jotai';
import { MonitorIcon } from 'lucide-react';

import { updateScreen } from '@/api/vm';
import * as ls from '@/lib/localstorage';
import { resolutionAtom, videoModeAtom } from '@/jotai/screen.ts';

import { BitRateMap, QualityMap } from './constants.ts';
import { Fps } from './fps';
import { FrameDetect } from './frame-detect';
import { Quality } from './quality';
import { Resolution } from './resolution';
import { VideoMode } from './video-mode.tsx';

export const Screen = () => {
  const videoMode = useAtomValue(videoModeAtom);
  const resolution = useAtomValue(resolutionAtom);
  const [fps, setFps] = useState(30);
  const [quality, setQuality] = useState(80);

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
        </div>
      }
      placement="rightBottom"
      trigger="click"
    >
      <div className="flex h-[32px] cursor-pointer items-center justify-center rounded px-2 text-neutral-300 hover:bg-neutral-700/80">
        <MonitorIcon size={18} />
      </div>
    </Popover>
  );
};

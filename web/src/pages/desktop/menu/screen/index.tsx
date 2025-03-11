import { useAtomValue } from 'jotai';
import { MonitorIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { updateScreen } from '@/api/vm';
import { MenuItem } from '@/components/menu-item.tsx';
import { resolutionAtom, videoModeAtom } from '@/jotai/screen.ts';
import * as ls from '@/lib/localstorage';

import { BitRateMap, QualityMap } from './constants.ts';
import { Fps } from './fps';
import { FrameDetect } from './frame-detect';
import { Quality } from './quality';
import { Reset } from './reset.tsx';
import { Resolution } from './resolution';
import { Screenshot } from './screenshot';
import { VideoMode } from './video-mode.tsx';

export const Screen = () => {
  const { t } = useTranslation();

  const videoMode = useAtomValue(videoModeAtom);
  const resolution = useAtomValue(resolutionAtom);

  const [fps, setFps] = useState(30);
  const [quality, setQuality] = useState(2);

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

  const content = (
    <div className="flex flex-col space-y-1">
      <VideoMode />
      <Resolution />
      <Quality quality={quality} setQuality={setQuality} />
      <Fps fps={fps} setFps={setFps} />
      {videoMode === 'mjpeg' && <FrameDetect />}
      <Screenshot />
      <Reset />
    </div>
  );

  return <MenuItem title={t('screen.title')} icon={<MonitorIcon size={18} />} content={content} />;
};

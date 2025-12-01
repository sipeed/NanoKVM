import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { MonitorIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { updateScreen } from '@/api/vm';
import * as ls from '@/lib/localstorage';
import { resolutionAtom, videoModeAtom } from '@/jotai/screen.ts';
import { MenuItem } from '@/components/menu-item.tsx';

import { BitRateMap, QualityMap } from './constants.ts';
import { Fps } from './fps';
import { FrameDetect } from './frame-detect';
import { Gop } from './gop.tsx';
import { Quality } from './quality';
import { Reset } from './reset.tsx';
import { Resolution } from './resolution';
import { VideoMode } from './video-mode.tsx';

export const Screen = () => {
  const { t } = useTranslation();

  const videoMode = useAtomValue(videoModeAtom);
  const resolution = useAtomValue(resolutionAtom);
  const [fps, setFps] = useState(30);
  const [quality, setQuality] = useState(2);
  const [gop, setGop] = useState(30);

  useEffect(() => {
    updateScreen('type', videoMode === 'mjpeg' ? 0 : 1);
    updateScreen('resolution', resolution!.height);
    updateQuality();
    updateFps();
    updateGop();
  }, []);

  async function updateQuality() {
    const cookieQuality = ls.getQuality();
    if (!cookieQuality) return;

    const key = cookieQuality >= 1 && cookieQuality <= 4 ? cookieQuality : 2;
    const value = videoMode === 'mjpeg' ? QualityMap.get(key)! : BitRateMap.get(key)!;

    const rsp = await updateScreen('quality', value);
    if (rsp.code === 0) {
      setQuality(key);
    }
  }

  async function updateFps() {
    const cookieFps = ls.getFps();
    if (!cookieFps) return;

    const rsp = await updateScreen('fps', cookieFps);
    if (rsp.code === 0) {
      setFps(cookieFps);
    }
  }

  async function updateGop() {
    const cookieGop = ls.getGop();
    if (!cookieGop) return;

    const rsp = await updateScreen('gop', cookieGop);
    if (rsp.code === 0) {
      setGop(cookieGop);
    }
  }

  const content = (
    <div className="flex flex-col space-y-1">
      <VideoMode />
      <Resolution />
      <Quality quality={quality} setQuality={setQuality} />
      <Fps fps={fps} setFps={setFps} />
      {videoMode !== 'mjpeg' && <Gop gop={gop} setGop={setGop} />}
      {videoMode === 'mjpeg' && <FrameDetect />}
      <Reset />
    </div>
  );

  return <MenuItem title={t('screen.title')} icon={<MonitorIcon size={18} />} content={content} />;
};

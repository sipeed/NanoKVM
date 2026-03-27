import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAtom, useAtomValue } from 'jotai';

import MonitorXIcon from '@/assets/images/monitor-x.svg';
import { stopFrameDetect } from '@/api/stream.ts';
import { getFrameDetect } from '@/lib/localstorage.ts';
import * as storage from '@/lib/localstorage.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';
import { resolutionAtom, videoScaleAtom } from '@/jotai/screen.ts';

export const Mjpeg = () => {
  const resolution = useAtomValue(resolutionAtom);
  const mouseStyle = useAtomValue(mouseStyleAtom);
  const [videoScale, setVideoScale] = useAtom(videoScaleAtom);
  const [hasError, setHasError] = useState(false);
  const scaledWidth = resolution?.width ? resolution.width * videoScale : undefined;

  useEffect(() => {
    // stop frame detect for a while
    const enabled = getFrameDetect();
    if (enabled) {
      stopFrameDetect(10);
    }
  }, [resolution]);

  useEffect(() => {
    const scale = storage.getVideoScale();
    if (scale) {
      setVideoScale(scale);
    }
  }, [setVideoScale]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden">
      <img
        id="screen"
        className={clsx('block select-none', mouseStyle)}
        style={{
          width: scaledWidth ? `min(100%, ${scaledWidth}px)` : '100%',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio:
            resolution?.width && resolution?.height
              ? `${resolution.width} / ${resolution.height}`
              : undefined,
          objectFit: 'contain'
        }}
        src={hasError ? MonitorXIcon : `${getBaseUrl('http')}/api/stream/mjpeg`}
        onError={() => setHasError(true)}
        onLoad={() => {
          if (hasError) {
            setHasError(false);
          }
        }}
        alt="screen"
      />
    </div>
  );
};

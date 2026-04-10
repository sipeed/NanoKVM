import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAtom, useAtomValue } from 'jotai';

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
  const [streamNonce, setStreamNonce] = useState(0);
  const streamURL = `${getBaseUrl('http')}/api/stream/mjpeg`;
  const streamSrc = hasError ? undefined : `${streamURL}?v=${streamNonce}`;

  useEffect(() => {
    // stop frame detect for a while
    const enabled = getFrameDetect();
    if (enabled) {
      stopFrameDetect(10);
    }
    setHasError(false);
    setStreamNonce((current) => current + 1);
  }, [resolution]);

  useEffect(() => {
    const scale = storage.getVideoScale();
    if (scale) {
      setVideoScale(scale);
    }
  }, [setVideoScale]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden bg-black">
      <img
        id="screen"
        className={clsx('block select-none', mouseStyle)}
        style={{
          transform: `scale(${videoScale})`,
          transformOrigin: 'center',
          ...(resolution?.width
            ? { width: resolution.width, height: resolution.height, objectFit: 'cover' }
            : { maxHeight: '100%', objectFit: 'scale-down' }),
          visibility: hasError ? 'hidden' : 'visible'
        }}
        src={streamSrc}
        onError={() => setHasError(true)}
        alt="screen"
      />
    </div>
  );
};

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';

import { stopFrameDetect } from '@/api/stream.ts';
import { getFrameDetect } from '@/lib/localstorage.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';
import { resolutionAtom } from '@/jotai/screen.ts';

import { ScreenViewport } from './viewport.tsx';

export const Mjpeg = () => {
  const resolution = useAtomValue(resolutionAtom);
  const mouseStyle = useAtomValue(mouseStyleAtom);
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

  return (
    <ScreenViewport>
      <img
        id="screen"
        className={clsx('block touch-none select-none', mouseStyle)}
        style={{
          visibility: hasError ? 'hidden' : 'visible'
        }}
        src={streamSrc}
        onError={() => setHasError(true)}
        alt="screen"
      />
    </ScreenViewport>
  );
};

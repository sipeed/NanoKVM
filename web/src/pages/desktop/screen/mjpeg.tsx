import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';

import { stopFrameDetect } from '@/api/stream.ts';
import { getFrameDetect } from '@/lib/localstorage.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';

import { ScreenViewport } from './viewport.tsx';

export const Mjpeg = () => {
  const mouseStyle = useAtomValue(mouseStyleAtom);
  const [hasError, setHasError] = useState(false);
  const streamURL = `${getBaseUrl('http')}/api/stream/mjpeg`;
  const streamSrc = hasError ? undefined : streamURL;

  useEffect(() => {
    // stop frame detect for a while
    const enabled = getFrameDetect();
    if (enabled) {
      stopFrameDetect(10);
    }
  }, []);

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

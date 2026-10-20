import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';

import { stopFrameDetect } from '@/api/stream.ts';
import { getFrameDetect } from '@/lib/localstorage.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';
import { resolutionAtom } from '@/jotai/screen.ts';

import { ScreenViewport } from './viewport.tsx';

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;
const STREAM_HEALTH_INTERVAL = 1000;

export const Mjpeg = () => {
  const resolution = useAtomValue(resolutionAtom);
  const mouseStyle = useAtomValue(mouseStyleAtom);
  const [hasError, setHasError] = useState(false);
  const [streamNonce, setStreamNonce] = useState(0);
  const image = useRef<HTMLImageElement>(null);
  const retryDelay = useRef(INITIAL_RETRY_DELAY);
  const retryTimer = useRef<number>();
  const streamURL = `${getBaseUrl('http')}/api/stream/mjpeg`;
  const streamSrc = hasError ? undefined : `${streamURL}?v=${streamNonce}`;

  const reconnect = useCallback(() => {
    if (retryTimer.current !== undefined) {
      return;
    }

    setHasError(true);

    retryTimer.current = window.setTimeout(() => {
      retryTimer.current = undefined;
      setStreamNonce((current) => current + 1);
      setHasError(false);
    }, retryDelay.current);
    retryDelay.current = Math.min(retryDelay.current * 2, MAX_RETRY_DELAY);
  }, []);

  const resetRetryDelay = useCallback(() => {
    retryDelay.current = INITIAL_RETRY_DELAY;
  }, []);

  useEffect(() => {
    // stop frame detect for a while
    const enabled = getFrameDetect();
    if (enabled) {
      stopFrameDetect(10);
    }
    window.clearTimeout(retryTimer.current);
    retryTimer.current = undefined;
    retryDelay.current = INITIAL_RETRY_DELAY;
    setHasError(false);
    setStreamNonce((current) => current + 1);

    return () => window.clearTimeout(retryTimer.current);
  }, [resolution]);

  useEffect(() => {
    const healthTimer = window.setInterval(() => {
      if (image.current?.complete && image.current.naturalWidth === 0 && !hasError) {
        reconnect();
      }
    }, STREAM_HEALTH_INTERVAL);

    return () => window.clearInterval(healthTimer);
  }, [hasError, reconnect]);

  return (
    <ScreenViewport>
      <img
        ref={image}
        id="screen"
        className={clsx('block touch-none select-none', mouseStyle)}
        style={{
          visibility: hasError ? 'hidden' : 'visible'
        }}
        src={streamSrc}
        onLoad={resetRetryDelay}
        onError={reconnect}
        alt="screen"
      />
    </ScreenViewport>
  );
};

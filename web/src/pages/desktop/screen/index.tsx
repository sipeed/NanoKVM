import { useEffect } from 'react';
import { Image } from 'antd';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';

import MonitorXIcon from '@/assets/images/monitor-x.svg';
import { stopFrameDetect } from '@/api/stream.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';
import { resolutionAtom, streamUrlAtom } from '@/jotai/screen.ts';

export const Screen = () => {
  const streamUrl = useAtomValue(streamUrlAtom);
  const resolution = useAtomValue(resolutionAtom);
  const mouseStyle = useAtomValue(mouseStyleAtom);

  useEffect(() => {
    // stop frame detect for a while
    stopFrameDetect();
  }, [resolution]);

  return (
    <div className={clsx('flex h-screen w-screen items-start justify-center xl:items-center')}>
      <Image
        id="screen"
        className={clsx('block select-none bg-neutral-950', mouseStyle)}
        style={
          resolution?.width
            ? { width: resolution.width, height: resolution.height, objectFit: 'cover' }
            : { maxHeight: '100vh', objectFit: 'scale-down' }
        }
        src={streamUrl}
        fallback={MonitorXIcon}
        preview={false}
      />
    </div>
  );
};

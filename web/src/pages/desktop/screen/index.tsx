import { useEffect } from 'react';
import { Image } from 'antd';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';

import MonitorXIcon from '@/assets/images/monitor-x.svg';
import { stopFrameDetect } from '@/api/stream.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';
import { resolutionAtom } from '@/jotai/resolution.ts';

export const Screen = () => {
  const resolution = useAtomValue(resolutionAtom);
  const mouseStyle = useAtomValue(mouseStyleAtom);

  useEffect(() => {
    // stop frame detect for a while
    stopFrameDetect();
  }, []);

  return (
    <div
      className="flex h-full w-full items-start justify-center xl:items-center"
      style={{ minWidth: `${resolution!.width}px`, minHeight: `${resolution!.height}px` }}
    >
      <Image
        id="screen"
        className={clsx(
          'block select-none bg-neutral-950',
          mouseStyle,
          resolution!.width === 800 ? 'object-cover' : 'object-none'
        )}
        width={resolution!.width}
        height={resolution!.height}
        src={`${window.location.protocol}//${window.location.host}/api/stream/mjpeg`}
        fallback={MonitorXIcon}
        preview={false}
      />
    </div>
  );
};

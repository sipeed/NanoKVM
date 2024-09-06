import { useEffect } from 'react';
import { Image } from 'antd';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';

import MonitorXIcon from '@/assets/images/monitor-x.svg';
import { stopFrameDetect } from '@/api/stream.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';
import { resolutionAtom } from '@/jotai/resolution.ts';
import { fitInWindowAtom } from '@/jotai/scaling.ts';

export const Screen = () => {
  const resolution = useAtomValue(resolutionAtom);
  const mouseStyle = useAtomValue(mouseStyleAtom);
  const fitInWindow = useAtomValue(fitInWindowAtom);

  useEffect(() => {
    // stop frame detect for a while
    stopFrameDetect();
  }, []);

  return (
    <div
      className={clsx(
        'flex h-full w-full justify-center',
        fitInWindow ? 'items-center' : 'items-start xl:items-center'
      )}
      style={fitInWindow ? undefined : { minWidth: `${resolution!.width}px`, minHeight: `${resolution!.height}px` }}
    >
      <Image
        id="screen"
        className={clsx(
          'block select-none bg-neutral-950',
          mouseStyle,
          fitInWindow ? undefined : (resolution!.width === 800 ? 'object-cover' : 'object-none'),
        )}
        style={fitInWindow ? { maxWidth: '100vw', maxHeight: '100vh' } : undefined}
        width={fitInWindow ? undefined : resolution!.width}
        height={fitInWindow ? undefined : resolution!.height}
        src={`${getBaseUrl('http')}/api/stream/mjpeg`}
        fallback={MonitorXIcon}
        preview={false}
      />
    </div>
  );
};

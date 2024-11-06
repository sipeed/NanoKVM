import { useAtomValue } from 'jotai';

import { videoModeAtom } from '@/jotai/screen.ts';

import { H264 } from './h264.tsx';
import { Mjpeg } from './mjpeg.tsx';

export const Screen = () => {
  const videoMode = useAtomValue(videoModeAtom);

  return <>{videoMode === 'mjpeg' ? <Mjpeg /> : <H264 />}</>;
};

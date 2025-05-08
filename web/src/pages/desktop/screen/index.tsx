import { useAtomValue } from 'jotai';

import { videoModeAtom } from '@/jotai/screen.ts';

import { H264Direct } from './h264-direct.tsx';
import { H264Webrtc } from './h264-webrtc.tsx';
import { Mjpeg } from './mjpeg.tsx';

export const Screen = () => {
  const videoMode = useAtomValue(videoModeAtom);

  if (videoMode === 'mjpeg') {
    return <Mjpeg />;
  }

  if (videoMode === 'direct') {
    return <H264Direct />;
  }

  return <H264Webrtc />;
};

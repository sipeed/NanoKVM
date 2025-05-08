import { atom } from 'jotai';

import { Resolution } from '@/types';

// video mode
// direct: stream H.264 over HTTP
// h264: stream H.264 over WebRTC
// mjpeg: stream JPEG over HTTP
export const videoModeAtom = atom('');

// browser screen resolution
export const resolutionAtom = atom<Resolution | null>(null);

import { atom } from 'jotai';

import { Resolution } from '@/types';

// video mode: h264 or mjpeg
export const videoModeAtom = atom('');

// browser screen resolution
export const resolutionAtom = atom<Resolution | null>(null);

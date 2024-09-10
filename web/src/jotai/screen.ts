import { atom } from 'jotai';

import { Resolution } from '@/types';

// mjpeg stream url
export const streamUrlAtom = atom('');

// browser screen resolution
export const resolutionAtom = atom<Resolution | null>(null);

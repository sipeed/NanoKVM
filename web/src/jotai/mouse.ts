import { atom } from 'jotai';

// mouse cursor style
export const mouseStyleAtom = atom('cursor-default');

// mouse mode: absolute or relative
export const mouseModeAtom = atom('absolute');

// mouse scroll interval (unit: ms)
export const scrollIntervalAtom = atom(0);

// hid mode: normal or hid-only
export const hidModeAtom = atom<'normal' | 'hid-only'>('normal');

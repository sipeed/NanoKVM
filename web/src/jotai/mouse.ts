import { atom } from 'jotai';

// mouse cursor style
export const mouseStyleAtom = atom('cursor-default');

// mouse mode: absolute or relative
export const mouseModeAtom = atom('absolute');

// mouse scroll interval (unit: ms)
export const scrollIntervalAtom = atom(0);

// hid bios mode: normal or bios
export const biosModeAtom = atom<'normal' | 'bios'>('normal');

// hid wow mode: no-wow or wow
export const wowModeAtom = atom<'no-wow' | 'wow'>('wow');

// hid mode: normal, hid-only, kbd-only or no-hid
export const hidModeAtom = atom<'normal' | 'hid-only' | 'kbd-only' | 'no-hid'>('normal');

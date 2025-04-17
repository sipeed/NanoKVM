import { atom } from 'jotai';

// mouse cursor style
export const mouseStyleAtom = atom('cursor-default');

// mouse mode: absolute or relative
export const mouseModeAtom = atom('absolute');

// hid mode: normal or hid-only
export const hidModeAtom = atom<'normal' | 'hid-only'>('normal');

// hid state: enabled or disabled
export const hidStateAtom = atom(false);
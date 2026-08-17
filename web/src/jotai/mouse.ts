import { atom } from 'jotai';

import type { InputAdapterMode } from '@/lib/input-adapter.ts';

// mouse cursor style
export const mouseStyleAtom = atom('cursor-default');

// mouse mode: absolute or relative
export const mouseModeAtom = atom('absolute');

// input adapter: auto, pointer-lock, or touchpad
export const inputAdapterAtom = atom<InputAdapterMode>('auto');

// mouse scroll direction: -1 or 1
export const scrollDirectionAtom = atom(-1);

// mouse scroll interval (unit: ms)
export const scrollIntervalAtom = atom(0);

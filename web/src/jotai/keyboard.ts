import { atom } from 'jotai';

// is the keyboard enabled (Disable keyboard events when input is required)
export const isKeyboardEnableAtom = atom(true);

// is the virtual keyboard opened
export const isKeyboardOpenAtom = atom(false);

// leader key code for bypassing browser shortcuts (empty string means disabled)
export const leaderKeyAtom = atom('');

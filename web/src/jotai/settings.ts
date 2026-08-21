import { atom } from 'jotai';

// menu bar disabled items
export const menuDisabledItemsAtom = atom<string[]>([]);

// track how many submenus are currently open
export const submenuOpenCountAtom = atom(0);

// signal all toolbar menus to close
export const menuCloseSignalAtom = atom(0);

// web title
export const webTitleAtom = atom('');

// menu display mode: 'off' | 'auto' | 'always'
export const menuDisplayModeAtom = atom<string>('auto');

// show the remote keyboard lock-status indicator beside the menu bar
export const keyboardLedStatusVisibleAtom = atom(true);

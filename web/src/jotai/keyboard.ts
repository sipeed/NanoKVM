import { atom } from 'jotai';

export type KeyboardLockSource = string;

type KeyboardLockAction = {
  source: KeyboardLockSource;
  locked: boolean;
};

const keyboardLocksAtom = atom<Set<KeyboardLockSource>>(new Set<KeyboardLockSource>());

// is the keyboard enabled (Disable keyboard events when input is required)
export const isKeyboardEnableAtom = atom((get) => get(keyboardLocksAtom).size === 0);

export const keyboardLockAtom = atom(null, (get, set, action: KeyboardLockAction) => {
  const locks = new Set(get(keyboardLocksAtom));
  if (action.locked) {
    locks.add(action.source);
  } else {
    locks.delete(action.source);
  }
  set(keyboardLocksAtom, locks);
});

// is the virtual keyboard opened
export const isKeyboardOpenAtom = atom(false);

// leader key code for bypassing browser shortcuts (empty string means disabled)
export const leaderKeyAtom = atom('');

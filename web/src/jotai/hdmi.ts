import { atom } from 'jotai';

// hid mode: normal or hid-only
export const hdmiEnabledAtom = atom<'enabled' | 'disabled'>('enabled');

import { atom } from 'jotai';

import { Resolution } from '@/types';

// remote host screen resolution
export const resolutionAtom = atom<Resolution | null>(null);

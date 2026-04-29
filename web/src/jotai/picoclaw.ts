import { atom } from 'jotai';

import { getPicoclawMaxRuntimeMs, getPicoclawMaxSteps } from '@/lib/picoclaw-storage.ts';
import type {
  PicoclawChatMessage,
  PicoclawConfigState,
  PicoclawOverlayState,
  PicoclawRunState,
  PicoclawRuntimeStatus,
  PicoclawTakeoverState,
  PicoclawTransportState
} from '@/types';

export const picoclawChatOpenAtom = atom(false);
export const picoclawMessagesAtom = atom<PicoclawChatMessage[]>([]);
export const picoclawTransportStateAtom = atom<PicoclawTransportState>('disconnected');
export const picoclawRunStateAtom = atom<PicoclawRunState>('idle');
export const picoclawRuntimeStatusAtom = atom<PicoclawRuntimeStatus | null>(null);
export const picoclawOverlayAtom = atom<PicoclawOverlayState>({
  visible: false,
  message: ''
});
export const picoclawConfigAtom = atom<PicoclawConfigState>({
  maxSteps: getPicoclawMaxSteps(),
  maxRuntimeMs: getPicoclawMaxRuntimeMs()
});
export const picoclawTakeoverStateAtom = atom<PicoclawTakeoverState>({
  active: false
});

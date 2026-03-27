import { atom } from 'jotai';

import { getPicoclawMaxRuntimeMs, getPicoclawMaxSteps } from '@/lib/picoclaw-storage.ts';

export type PicoclawTransportState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type PicoclawRunState = 'idle' | 'busy';

export type PicoclawRuntimeStatus = {
  ready: boolean;
  installed: boolean;
  installing: boolean;
  install_progress?: number;
  install_stage?: string;
  install_path?: string;
  agent_profile?: string;
  model_configured: boolean;
  model_name?: string;
  status: string;
  config_error?: string;
  last_error?: string;
  checked_at?: string;
  current_session?: string;
};

export type PicoclawRuntimeStartResult = {
  started: boolean;
  command: string;
  output?: string;
  status: PicoclawRuntimeStatus;
};

export type PicoclawRuntimeInstallResult = {
  installed: boolean;
  binary: string;
  download: string;
  output?: string;
  status: PicoclawRuntimeStatus;
};

export type PicoclawMessageKind =
  | 'user'
  | 'assistant'
  | 'status'
  | 'tool_action'
  | 'observation'
  | 'error';

export type PicoclawChatMessage = {
  id: string;
  kind: PicoclawMessageKind;
  text?: string;
  imageBase64?: string;
  createdAt: number;
  action?: string;
  pending?: boolean;
  raw?: unknown;
};

export type PicoclawOverlayState = {
  visible: boolean;
  message: string;
  x?: number;
  y?: number;
  action?: string;
};

export type PicoclawTakeoverState = {
  active: boolean;
  sessionId?: string;
  reason?: string;
};

export type PicoclawConfigState = {
  gatewayUrl: string;
  maxSteps: number;
  maxRuntimeMs: number;
};

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
  gatewayUrl: '',
  maxSteps: getPicoclawMaxSteps(),
  maxRuntimeMs: getPicoclawMaxRuntimeMs()
});
export const picoclawTakeoverStateAtom = atom<PicoclawTakeoverState>({
  active: false
});

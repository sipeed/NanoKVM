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
  provider?: string;
  auth_method?: string;
  oauth_available?: boolean;
  oauth_authenticated?: boolean;
  api_key_configured?: boolean;
  endpoint_configured?: boolean;
  status: string;
  config_error?: string;
  last_error?: string;
  checked_at?: string;
  current_session?: string;
};

export type PicoclawProviderPreset = {
  id: string;
  name: string;
  model_prefix: string;
  default_api_base?: string;
  endpoint_required: boolean;
  endpoint_editable: boolean;
  auth_methods: string[];
  models: string[];
  supports_web_search_preview?: boolean;
};

export type PicoclawModelConfig = {
  provider: string;
  model_name: string;
  model_identifier: string;
  api_base: string;
  auth_method: string;
  model_configured: boolean;
  api_key_configured: boolean;
  endpoint_configured: boolean;
  oauth_available: boolean;
  oauth_authenticated: boolean;
  agent_profile: string;
  providers: PicoclawProviderPreset[];
};

export type PicoclawAuthStatus = {
  provider: string;
  available: boolean;
  authenticated: boolean;
  status?: string;
  login_url?: string;
  user_code?: string;
  account?: string;
  expires_at?: string;
  error?: string;
  unavailable_reason?: string;
  missing_command?: string;
};

export type PicoclawAuthLogin = {
  provider: string;
  available: boolean;
  status: string;
  login_url?: string;
  user_code?: string;
  verification_uri?: string;
  state?: string;
  expires_in?: number;
  requires_code?: boolean;
  unavailable_reason?: string;
  missing_command?: string;
};

export type PicoclawModelTestResult = {
  ok: boolean;
  outcome: string;
  reply?: string;
  status_code?: number;
  log_ref?: string;
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
  maxSteps: getPicoclawMaxSteps(),
  maxRuntimeMs: getPicoclawMaxRuntimeMs()
});
export const picoclawTakeoverStateAtom = atom<PicoclawTakeoverState>({
  active: false
});

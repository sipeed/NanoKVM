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

export type PicoclawRuntimeInstallSnapshot = {
  installing: boolean;
  installProgress?: number;
  installStage?: string;
  status?: string;
};

export type PicoclawSessionListItem = {
  id: string;
  title: string;
  preview: string;
  message_count: number;
  created: string;
  updated: string;
};

export type GatewayAssistantMessage = {
  id: string;
  text: string;
  raw: Record<string, unknown>;
};

export type GatewayToolAction = {
  id: string;
  action: string;
  x?: number;
  y?: number;
  raw: Record<string, unknown>;
};

export type GatewayObservation = {
  id: string;
  text?: string;
  imageBase64?: string;
  raw: Record<string, unknown>;
};

export type GatewayError = {
  code: string;
  message: string;
  raw?: unknown;
};

export type GatewayClose = {
  code: number;
  reason: string;
};

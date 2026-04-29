import { http } from '@/lib/http.ts';
import { picoclawGateway } from '@/lib/picoclaw-gateway.ts';
import type { PicoclawRunState, PicoclawTransportState } from '@/types';

const sessionIDHeader = 'X-PicoClaw-Session-ID';

type ModelConfigRequest = {
  model: string;
  api_base: string;
  api_key: string;
};

type AgentProfileRequest = {
  profile: string;
};

export function setPicoclawModelConfig(data: ModelConfigRequest) {
  return http.post('/api/picoclaw/model/config', data);
}

export function setPicoclawAgentProfile(data: AgentProfileRequest) {
  return http.post('/api/picoclaw/agent/profile', data);
}

export function listPicoclawSessions(params?: { offset?: number; limit?: number }) {
  return http.get('/api/picoclaw/sessions', { params });
}

export function getPicoclawSession(id: string) {
  return http.get(`/api/picoclaw/sessions/${id}`);
}

export function deletePicoclawSession(id: string) {
  return http.delete(`/api/picoclaw/sessions/${id}`);
}

export function getRuntimeStatus() {
  return http.get('/api/picoclaw/runtime/status');
}

export function startRuntime() {
  return http.post('/api/picoclaw/runtime/start');
}

export function stopRuntime() {
  return http.post('/api/picoclaw/runtime/stop');
}

export function installRuntime() {
  return http.post('/api/picoclaw/runtime/install');
}

export function uninstallRuntime() {
  return http.post('/api/picoclaw/runtime/uninstall');
}

export function connectGateway(sessionId?: string) {
  return picoclawGateway.connect({ sessionId });
}

export function releaseRuntimeSession(sessionId?: string) {
  const activeSessionId = sessionId || picoclawGateway.getSessionId();
  if (!activeSessionId) {
    return Promise.resolve(null);
  }

  return http.request({
    method: 'delete',
    url: '/api/picoclaw/runtime/session',
    headers: {
      [sessionIDHeader]: activeSessionId
    }
  });
}

export function sendChatMessage(
  content: string,
  options?: { id?: string; maxSteps?: number; maxRuntimeMs?: number; trackState?: boolean }
) {
  return picoclawGateway.sendChatMessage(content, options);
}

export function sendStopMessage() {
  return picoclawGateway.sendStopMessage();
}

export function closeGateway() {
  const activeSessionId = picoclawGateway.getSessionId();
  picoclawGateway.close();
  if (!activeSessionId) {
    return;
  }

  void releaseRuntimeSession(activeSessionId).catch(() => undefined);
}

export function onGatewayConnectionState(listener: (state: PicoclawTransportState) => void) {
  return picoclawGateway.on('transport_state', listener);
}

export function onGatewayRunState(listener: (state: PicoclawRunState) => void) {
  return picoclawGateway.on('run_state', listener);
}

export { picoclawGateway };

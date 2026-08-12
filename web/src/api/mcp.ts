import { http } from '@/lib/http.ts';

export type MCPConfig = {
  enabled: boolean;
  apiKey: string;
  controlMode: 'off' | 'mcp' | 'picoclaw';
  transitioning: boolean;
};

export function getMCPConfig() {
  return http.get('/api/mcp/config');
}

export function setMCPEnabled(enabled: boolean) {
  return http.post('/api/mcp/config', { enabled });
}

export function regenerateMCPAPIKey() {
  return http.post('/api/mcp/key/regenerate');
}

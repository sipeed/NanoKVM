import { http } from '@/lib/http.ts';

// wake on lan
export function wol(mac: string) {
  const data = {
    mac
  };
  return http.post('/api/network/wol', data);
}

// get wake-on-lan macs history
export function getWolMacs() {
  return http.get('/api/network/wol/mac');
}

export function deleteWolMac(mac: string) {
  return http.request({
    method: 'delete',
    url: '/api/network/wol/mac',
    data: { mac }
  });
}

// install tailscale
export function installTailscale() {
  return http.post('/api/network/tailscale/install');
}

// get tailscale status
export function getTailscaleStatus() {
  return http.get('/api/network/tailscale/status');
}

// update tailscale status
export function updateTailscaleStatus(command: 'up' | 'down') {
  return http.post('/api/network/tailscale/status', { command });
}

// login tailscale
export function loginTailscale() {
  return http.post('/api/network/tailscale/login');
}

// logout tailscale
export function logoutTailscale() {
  return http.post('/api/network/tailscale/logout');
}

// get wifi information
export function getWiFi() {
  return http.get('/api/network/wifi');
}

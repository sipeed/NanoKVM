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

// uninstall tailscale
export function uninstallTailscale() {
  return http.post('/api/network/tailscale/uninstall');
}

// get tailscale status
export function getTailscaleStatus() {
  return http.get('/api/network/tailscale/status');
}

// run tailscale up
export function upTailscale() {
  return http.post('/api/network/tailscale/up');
}

// run tailscale down
export function downTailscale() {
  return http.post('/api/network/tailscale/down');
}

// login tailscale
export function loginTailscale() {
  return http.post('/api/network/tailscale/login');
}

// logout tailscale
export function logoutTailscale() {
  return http.post('/api/network/tailscale/logout');
}

// stop tailscale
export function stopTailscale() {
  return http.post('/api/network/tailscale/stop');
}

// restart tailscale
export function restartTailscale() {
  return http.post('/api/network/tailscale/restart');
}

// get wifi information
export function getWiFi() {
  return http.get('/api/network/wifi');
}

// connect wifi
export function connectWifi(ssid: string, password: string) {
  const data = {
    ssid,
    password
  };
  return http.post('/api/network/wifi', data);
}

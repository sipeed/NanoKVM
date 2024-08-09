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

// check if tailscale exists
export function getTailscale() {
  return http.get('/api/network/tailscale');
}

// install tailscale
export function installTailscale() {
  return http.post('/api/network/tailscale/install');
}

// run tailscale
export function runTailscale() {
  return http.post('/api/network/tailscale/run');
}

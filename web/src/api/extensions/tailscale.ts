import { http } from '@/lib/http.ts';

// Tailscale is downloaded and validated on the device before it is published.
// The server bounds that work to four minutes, so Http's shared 60s timeout
// must not abort the request context mid-install.
const INSTALL_TIMEOUT = 6 * 60 * 1000;

// install tailscale
export function install() {
  return http.post('/api/extensions/tailscale/install', undefined, { timeout: INSTALL_TIMEOUT });
}

// uninstall tailscale
export function uninstall() {
  return http.post('/api/extensions/tailscale/uninstall');
}

// get tailscale status
export function getStatus() {
  return http.get('/api/extensions/tailscale/status');
}

// start tailscale
export function start() {
  return http.post('/api/extensions/tailscale/start');
}

// restart tailscale
export function restart() {
  return http.post('/api/extensions/tailscale/restart');
}

// stop tailscale
export function stop() {
  return http.post('/api/extensions/tailscale/stop');
}

// run tailscale up
export function up() {
  return http.post('/api/extensions/tailscale/up');
}

// run tailscale down
export function down() {
  return http.post('/api/extensions/tailscale/down');
}

// login tailscale
export function login() {
  return http.post('/api/extensions/tailscale/login');
}

// logout tailscale
export function logout() {
  return http.post('/api/extensions/tailscale/logout');
}

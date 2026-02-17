import { http } from '@/lib/http.ts';

export function install() {
  return http.post('/api/extensions/netbird/install');
}

export function uninstall() {
  return http.post('/api/extensions/netbird/uninstall');
}

export function getStatus() {
  return http.get('/api/extensions/netbird/status');
}

export function login() {
  return http.post('/api/extensions/netbird/login');
}

export function start() {
  return http.post('/api/extensions/netbird/start');
}

export function restart() {
  return http.post('/api/extensions/netbird/restart');
}

export function stop() {
  return http.post('/api/extensions/netbird/stop');
}

export function up(setupKey: string, managementUrl: string, adminUrl: string) {
  return http.post('/api/extensions/netbird/up', {
    setupKey,
    managementUrl,
    adminUrl
  });
}

export function down() {
  return http.post('/api/extensions/netbird/down');
}

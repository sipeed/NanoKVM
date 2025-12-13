import { http } from '@/lib/http.ts';

// get application version
export function getVersion() {
  return http.get('/api/application/version');
}

// get application Current version
export function getCurrentVersion() {
  return http.get('/api/application/currentversion');
}

// update application to latest version
export function update() {
  return http.request({
    method: 'post',
    url: '/api/application/update',
    timeout: 15 * 60 * 1000
  });
}

// enable/disable preview updates
export function setPreviewUpdates(enable: boolean) {
  const data = {
    enable
  };
  return http.post('/api/application/preview', data);
}

// get preview updates state
export function getPreviewUpdates() {
  return http.get('/api/application/preview');
}


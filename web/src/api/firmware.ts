import { http } from '@/lib/http.ts';

// get firmware version
export function getVersion() {
  return http.get('/api/firmware/version');
}

// update firmware to latest version
export function update() {
  return http.request({
    method: 'post',
    url: '/api/firmware/update',
    timeout: 3 * 60 * 1000
  });
}

// check if the lib exists
export function getLib() {
  return http.get('/api/firmware/lib');
}

// update lib
export function updateLib() {
  return http.post('/api/firmware/lib/update');
}

import { http } from '@/lib/http.ts';

// get application version
export function getVersion() {
  return http.get('/api/application/version');
}

// update application to latest version
export function update() {
  return http.request({
    method: 'post',
    url: '/api/application/update',
    timeout: 15 * 60 * 1000
  });
}

// check if lib exists
export function getLib() {
  return http.get('/api/application/lib');
}

// download lib
export function updateLib() {
  return http.post('/api/application/lib');
}

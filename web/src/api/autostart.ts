import { http } from '@/lib/http.ts';

export function getAutostart() {
  return http.get('/api/vm/autostart');
}

export function uploadAutostart(name: string, content: string) {
  return http.post('/api/vm/autostart/' + name, { content });
}

export function deleteAutostart(name: string) {
  return http.request({
    url: '/api/vm/autostart/' + name,
    method: 'delete',
  });
}

export function getAutostartContent(name: string) {
    return http.get('/api/vm/autostart/' + name);
}

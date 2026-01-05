import { http } from '@/lib/http.ts';

export function uploadScript(formData: FormData) {
  return http.request({
    url: '/api/vm/script/upload',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData
  });
}

export function runScript(name: string, type: string) {
  return http.post('/api/vm/script/run', { name, type });
}

export function getScripts() {
  return http.get('/api/vm/script');
}

export function deleteScript(name: string) {
  const data = {
    name
  };
  return http.delete('/api/vm/script', data);
}

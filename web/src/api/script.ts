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
  const data = {
    name,
    type
  };

  return http.request({
    url: '/api/vm/script/run',
    method: 'post',
    data
  });
}

export function getScripts() {
  return http.get('/api/vm/script');
}

export function deleteScript(name: string) {
  return http.request({
    url: '/api/vm/script',
    method: 'delete',
    data: { name }
  });
}

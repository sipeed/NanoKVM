import { http } from '@/lib/http.ts';

// Download image
export function downloadImage(file?: string) {
  const data = {
      file: file ? file : ''
    };
  return http.post('/api/download/image', data);
}

export function statusImage() {
  return http.get('/api/download/image/status');
}

export function imageEnabled() {
  return http.get('/api/download/image/enabled');
}

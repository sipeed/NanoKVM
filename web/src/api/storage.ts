import { http } from '@/lib/http.ts';

// get image list
export function getImages() {
  return http.get('/api/storage/image');
}

// get mounted image
export function getMountedImage() {
  return http.get('/api/storage/image/mounted');
}

// mount/unmount image
export function mountImage(file?: string) {
  const data = {
    file: file ? file : ''
  };
  return http.post('/api/storage/image/mount', data);
}

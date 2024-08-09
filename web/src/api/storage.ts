import { http } from '@/lib/http.ts';

// get image list
export function getImages() {
  return http.get('/api/storage/images');
}

// get mounted image
export function getMountedImage() {
  return http.get('/api/storage/images/mounted');
}

// mount/unmount image
export function mountImage(file?: string) {
  const data = {
    file: file ? file : ''
  };
  return http.post('/api/storage/image/mount', data);
}

// reset hid
export function resetHid() {
  return http.post('/api/storage/hid/reset');
}

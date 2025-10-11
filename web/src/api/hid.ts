import { http } from '@/lib/http.ts';

// paste
export function paste(content: string) {
  return http.post('/api/hid/paste', { content });
}

// reset hid
export function reset() {
  return http.post('/api/hid/reset');
}

// get bios mode
export function getBiosMode() {
  return http.get('/api/hid/bios');
}

// set bios mode
export function setBiosMode(mode: string) {
  const data = {
    mode
  };
  return http.post('/api/hid/bios', data);
}

// get hid mode
export function getHidMode() {
  return http.get('/api/hid/mode');
}

// set hid mode
export function setHidMode(mode: string) {
  const data = {
    mode
  };
  return http.post('/api/hid/mode', data);
}

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

// get wake on write mode
export function getWowMode() {
  return http.get('/api/hid/wow');
}

// set wake on write mode
export function setWowMode(mode: string) {
  const data = {
    mode
  };
  return http.post('/api/hid/wow', data);
}

// get hid mode
export function getHidMode() {
  return http.get('/api/hid/mode');
}

// set hid mode
export function setHidMode(mode: string, bios: string, wow: string) {
  const data = {
    mode,
    bios,
    wow
  };
  return http.post('/api/hid/mode', data);
}

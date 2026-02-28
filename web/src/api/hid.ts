import { http } from '@/lib/http.ts';

// paste
export function paste(content: string, langue: string) {
  return http.post('/api/hid/paste', { content, langue });
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

// get shortcuts
export function getShortcuts() {
  return http.get('/api/hid/shortcuts');
}

// add shortcut
export function addShortcut(keys: any[]) {
  const data = {
    keys
  };
  return http.post('/api/hid/shortcut', data);
}

// delete shortcut
export function deleteShortcut(id: string) {
  const data = {
    id
  };
  return http.delete('/api/hid/shortcut', data);
}

// get shortcut leader key
export function getLeaderKey() {
  return http.get('/api/hid/shortcut/leader-key');
}

// set shortcut leader key
export function setLeaderKey(key: string) {
  return http.post('/api/hid/shortcut/leader-key', { key });
}

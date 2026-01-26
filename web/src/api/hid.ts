import { http } from '@/lib/http.ts';

// paste
export function paste(content: string, langue: string) {
  return http.post('/api/hid/paste', { content, langue });
}

// reset hid
export function reset() {
  return http.post('/api/hid/reset');
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

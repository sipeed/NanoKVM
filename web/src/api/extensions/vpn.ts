import { http } from '@/lib/http.ts';

export function getPreference() {
  return http.get('/api/extensions/vpn/preference');
}

export function setPreference(vpn: string) {
  return http.post('/api/extensions/vpn/preference', { vpn });
}

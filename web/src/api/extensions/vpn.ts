import { http } from '@/lib/http.ts';

// A preference switch may first verify the incoming client and then stop the
// old daemon. Its bounded server-side work can exceed Http's shared 60s
// default, so the UI must wait for the result rather than misreporting a
// completed switch as a client-side failure.
const PREFERENCE_TIMEOUT = 180 * 1000;

export function getPreference() {
  return http.get('/api/extensions/vpn/preference');
}

export function setPreference(vpn: string) {
  return http.post('/api/extensions/vpn/preference', { vpn }, { timeout: PREFERENCE_TIMEOUT });
}

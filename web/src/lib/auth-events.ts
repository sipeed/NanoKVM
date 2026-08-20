export const AUTH_EXPIRED_EVENT = 'nano-kvm:auth-expired';

export function notifyAuthExpired() {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

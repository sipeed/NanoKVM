export const AUTH_EXPIRED_EVENT = 'nano-kvm:auth-expired';

export function notifyAuthExpired() {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

export const AUTH_REFRESH_EVENT = 'nano-kvm:auth-refresh';

const REFRESH_INTERVAL = 2000;

let lastRefreshNotifyAt = 0;
let pendingRefresh: ReturnType<typeof setTimeout> | null = null;

// notifyAuthRefresh asks the app to silently refetch the current account,
// e.g. after permissions changed. It is rate limited because it is also
// triggered by any 403 response, but events are coalesced rather than dropped:
// the last change still has to be applied, otherwise a grant that lands right
// after another update would stay invisible until the next reload.
export function notifyAuthRefresh() {
  const now = Date.now();
  const elapsed = now - lastRefreshNotifyAt;

  if (elapsed < REFRESH_INTERVAL) {
    if (pendingRefresh === null) {
      pendingRefresh = setTimeout(() => {
        pendingRefresh = null;
        lastRefreshNotifyAt = Date.now();
        window.dispatchEvent(new Event(AUTH_REFRESH_EVENT));
      }, REFRESH_INTERVAL - elapsed);
    }
    return;
  }

  lastRefreshNotifyAt = now;
  window.dispatchEvent(new Event(AUTH_REFRESH_EVENT));
}

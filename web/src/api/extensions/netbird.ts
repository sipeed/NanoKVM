import { http } from '@/lib/http.ts';

// NanoKVM's RISC-V NetBird CLI can take a while to produce a login URL or stop
// a daemon. Keep a transport budget larger than the server's bounded command
// deadline; a transport timeout is treated by the UI as an unknown result, not
// as proof that the operation failed or succeeded. `http.get` takes no
// per-request config, so status goes through `http.request`.
const SLOW_CALL_TIMEOUT = 180 * 1000;

// Install downloads the client (~14 MB compressed) over whatever uplink the
// device has, so it gets a far larger budget than the CLI calls.
const DOWNLOAD_TIMEOUT = 10 * 60 * 1000;

export function install() {
  return http.post('/api/extensions/netbird/install', undefined, {
    timeout: DOWNLOAD_TIMEOUT
  });
}

// An update downloads the same client an install does, then swaps it in.
export function update() {
  return http.post('/api/extensions/netbird/update', undefined, {
    timeout: DOWNLOAD_TIMEOUT
  });
}

export function uninstall() {
  return http.post('/api/extensions/netbird/uninstall', undefined, {
    timeout: SLOW_CALL_TIMEOUT
  });
}

export function getStatus() {
  return http.request({
    method: 'get',
    url: '/api/extensions/netbird/status',
    timeout: SLOW_CALL_TIMEOUT
  });
}

export function login() {
  return http.post('/api/extensions/netbird/login', undefined, {
    timeout: SLOW_CALL_TIMEOUT
  });
}

export function start() {
  return http.post('/api/extensions/netbird/start', undefined, {
    timeout: SLOW_CALL_TIMEOUT
  });
}

export function restart() {
  return http.post('/api/extensions/netbird/restart', undefined, {
    timeout: SLOW_CALL_TIMEOUT
  });
}

export function stop() {
  return http.post('/api/extensions/netbird/stop', undefined, {
    timeout: SLOW_CALL_TIMEOUT
  });
}

export function down() {
  // Do not let Http's shared 60s default turn a slow device response into an
  // ambiguous client-side failure.
  return http.post('/api/extensions/netbird/down', undefined, {
    timeout: SLOW_CALL_TIMEOUT
  });
}

export function getHostname(): string {
  const ip = import.meta.env.VITE_SERVER_IP as string;
  return ip ? ip : window.location.hostname;
}

export function getPort(): string {
  if (import.meta.env.VITE_SERVER_PORT) {
    return import.meta.env.VITE_SERVER_PORT;
  }

  if (window.location.port) {
    return window.location.port;
  }

  return window.location.protocol === 'https:' ? '443' : '80';
}

export function getBaseUrl(type: 'http' | 'ws'): string {
  let protocol = window.location.protocol;
  if (type === 'ws') {
    protocol = protocol === 'https:' ? 'wss:' : 'ws:';
  }

  const hostname = getHostname();
  const port = getPort();
  const baseUrl = `${protocol}//${hostname}`;

  const isDefaultPort =
    ((protocol === 'https:' || protocol === 'wss:') && port === '443') ||
    ((protocol === 'http:' || protocol === 'ws:') && port === '80');

  return isDefaultPort ? baseUrl : `${baseUrl}:${port}`;
}

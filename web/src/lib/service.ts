export function getHostname(): string {
  const ip = import.meta.env.VITE_SERVER_IP as string;
  return ip ? ip : window.location.hostname;
}

export function getPort(): string {
  const port = import.meta.env.VITE_SERVER_PORT as string;
  return port ? port : window.location.port;
}

export function getBaseUrl(type: 'http' | 'ws'): string {
  let protocol = window.location.protocol;
  if (type === 'ws') {
    protocol = protocol === 'https:' ? 'wss:' : 'ws:';
  }

  const hostname = getHostname();
  const port = getPort();

  return `${protocol}//${hostname}:${port}`;
}

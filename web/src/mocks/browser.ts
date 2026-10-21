import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';

let isLoggedIn = false;

export const handlers = [
  http.post('/api/auth/login', () => {
    isLoggedIn = true;
    return HttpResponse.json({
      code: 0,
      data: {}
    });
  }),
  http.get('/api/auth/account', () => {
    if (!isLoggedIn) {
      return HttpResponse.json('unauthorized', { status: 401 });
    }
    return HttpResponse.json({
      code: 0,
      data: { username: 'admin', role: 'admin', permissions: [] }
    });
  }),
  http.post('/api/auth/logout', () => {
    isLoggedIn = false;
    return HttpResponse.json({ code: 0 });
  }),
  http.get('/api/auth/users', () => {
    return HttpResponse.json({
      code: 0,
      data: {
        users: [
          {
            username: 'admin',
            role: 'admin',
            enabled: true,
            permissions: [],
            systemAccount: true
          },
          {
            username: 'watermeko',
            role: 'user',
            enabled: true,
            permissions: ['console.view', 'console.control', 'power']
          },
          {
            username: 'test',
            role: 'user',
            enabled: false,
            permissions: ['console.view']
          }
        ]
      }
    });
  }),
  http.get('/api/auth/permissions', () => {
    return HttpResponse.json({
      code: 0,
      data: {
        permissions: [
          { id: 'console.view', group: 'console', risk: 'info' },
          {
            id: 'console.control',
            group: 'console',
            risk: 'info',
            implies: ['console.view']
          },
          { id: 'power', group: 'target', risk: 'info', implies: ['console.view'] },
          {
            id: 'medium.attach',
            group: 'target',
            risk: 'info',
            implies: ['library.read']
          },
          { id: 'library.read', group: 'library', risk: 'info' },
          {
            id: 'library.write',
            group: 'library',
            risk: 'info',
            implies: ['library.read']
          },
          { id: 'terminal', group: 'host', risk: 'warn' },
          { id: 'device', group: 'host', risk: 'info', implies: ['console.view'] },
          { id: 'network', group: 'host', risk: 'info', implies: ['console.view'] },
          { id: 'update', group: 'host', risk: 'warn', implies: ['console.view'] },
          { id: 'mcp', group: 'services', risk: 'warn', implies: ['console.view'] },
          { id: 'tailscale', group: 'services', risk: 'info', implies: ['console.view'] },
          { id: 'ai', group: 'services', risk: 'warn', implies: ['console.view'] }
        ]
      }
    });
  })
];
export const worker = setupWorker(...handlers);

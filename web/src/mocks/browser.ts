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
          'console.view',
          'console.control',
          'power',
          'media.mount',
          'media.manage',
          'terminal',
          'device',
          'network',
          'update',
          'mcp',
          'tailscale',
          'ai'
        ]
      }
    });
  })
];
export const worker = setupWorker(...handlers);

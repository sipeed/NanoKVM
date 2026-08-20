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
      data: { username: 'admin', role: 'admin' }
    });
  }),
  http.post('/api/auth/logout', () => {
    isLoggedIn = false;
    return HttpResponse.json({ code: 0 });
  })
];
export const worker = setupWorker(...handlers);

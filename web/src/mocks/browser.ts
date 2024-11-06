import { setupWorker } from 'msw/browser'
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
        code: 0,
        data: {
            token: 'mocked_token',
        },
    })
  }),
]
export const worker = setupWorker(...handlers)

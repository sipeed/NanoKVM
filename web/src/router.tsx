import { createHashRouter } from 'react-router-dom';

import { ProtectedRoute } from '@/components/auth';
import { Root } from '@/components/root';

export const router = createHashRouter([
  {
    path: '/auth/login',
    lazy: async () => {
      const { Login } = await import('./pages/auth/login');
      return { Component: Login };
    }
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Root />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        lazy: async () => {
          const { Desktop } = await import('./pages/desktop');
          return { Component: Desktop };
        }
      },
      {
        path: 'terminal',
        lazy: async () => {
          const { Terminal } = await import('./pages/terminal');
          return { Component: Terminal };
        }
      },
      {
        path: 'auth/password',
        lazy: async () => {
          const { Password } = await import('./pages/auth/password');
          return { Component: Password };
        }
      }
    ]
  },
  {
    path: '/wifi',
    lazy: async () => {
      const { Wifi } = await import('./pages/wifi');
      return { Component: Wifi };
    }
  }
]);

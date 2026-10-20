import { createHashRouter, Outlet } from 'react-router-dom';

import { MEDIA_PERMISSIONS } from '@/api/auth.ts';
import { PermissionRoute, ProtectedRoute } from '@/components/auth';
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
        element: (
          <PermissionRoute permission="terminal">
            <Outlet />
          </PermissionRoute>
        ),
        children: [
          {
            path: 'terminal',
            lazy: async () => {
              const { Terminal } = await import('./pages/terminal');
              return { Component: Terminal };
            }
          }
        ]
      },
      {
        element: (
          <PermissionRoute permission={MEDIA_PERMISSIONS}>
            <Outlet />
          </PermissionRoute>
        ),
        children: [
          {
            path: 'storage',
            lazy: async () => {
              const { Storage } = await import('./pages/storage');
              return { Component: Storage };
            }
          }
        ]
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
    caseSensitive: false,
    lazy: async () => {
      const { Wifi } = await import('./pages/wifi');
      return { Component: Wifi };
    }
  }
]);

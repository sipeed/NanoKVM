import { createContext, useContext } from 'react';

import { Account, Permission } from '@/api/auth.ts';

export type AuthState = {
  account: Account;
  hasPermission: (permission: Permission) => boolean;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth must be used inside ProtectedRoute');
  }
  return auth;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}

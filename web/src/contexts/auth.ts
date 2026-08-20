import { createContext, useContext } from 'react';

import { Account } from '@/api/auth.ts';

export type AuthState = {
  account: Account;
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

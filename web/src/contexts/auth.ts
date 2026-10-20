import { createContext, useContext } from 'react';

import { Account, Permission } from '@/api/auth.ts';

export type AuthState = {
  account: Account;
  hasPermission: (permission: Permission) => boolean;
  // hasAnyPermission reports whether the account holds at least one of the
  // permissions, which is how a feature split across two grants (media.mount
  // and media.manage, for instance) is checked at once.
  hasAnyPermission: (permissions: Permission[]) => boolean;
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

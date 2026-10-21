import { createContext, useContext } from 'react';

import { Account, Permission } from '@/api/auth.ts';

export type AuthState = {
  account: Account;
  // hasPermission reports whether the account effectively holds the grant. The
  // server resolves implied grants into the account it serves, so a call site
  // never has to check a pair (library.read is implied by both library.write
  // and medium.attach, for instance).
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

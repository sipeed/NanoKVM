import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { existToken } from '@/lib/cookie.ts';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const hasToken = existToken();

  if (!hasToken) {
    return <Navigate to={'/auth/login'} replace />;
  }

  return children;
};

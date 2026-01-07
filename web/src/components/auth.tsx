import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { existToken } from '@/lib/cookie.ts';
import { getAuthStatus } from '@/api/application.ts';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthEnabled, setIsAuthEnabled] = useState(true);
  const hasToken = existToken();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const rsp = await getAuthStatus();
        setIsAuthEnabled(rsp.data.enabled);
      } catch (err) {
        setIsAuthEnabled(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return null;
  }

  if (!isAuthEnabled) {
    return <>{children}</>;
  }

  if (!hasToken) {
    return <Navigate to={'/auth/login'} replace />;
  }

  return children;
};


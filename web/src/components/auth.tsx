import { ReactNode, useEffect, useState } from 'react';
import { AuthContext, useAuth } from '@/contexts/auth.ts';
import { Spin } from 'antd';
import { Navigate } from 'react-router-dom';

import { Account, getAccount } from '@/api/auth.ts';
import { AUTH_EXPIRED_EVENT } from '@/lib/auth-events.ts';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    let active = true;

    getAccount()
      .then((rsp) => {
        if (!active) return;
        if (rsp.code !== 0 || !rsp.data?.username) {
          setIsAuthenticated(false);
          return;
        }

        setAccount({
          username: rsp.data.username,
          role: rsp.data.role === 'admin' ? 'admin' : 'user'
        });
      })
      .catch(() => {
        if (active) setIsAuthenticated(false);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const handleAuthExpired = () => {
      setAccount(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      active = false;
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated || !account) {
    return <Navigate to={'/auth/login'} replace />;
  }

  return <AuthContext.Provider value={{ account }}>{children}</AuthContext.Provider>;
};

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { account } = useAuth();
  return account.role === 'admin' ? children : <Navigate to="/" replace />;
};

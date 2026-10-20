import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AuthContext, useAuth } from '@/contexts/auth.ts';
import { Spin } from 'antd';
import { Navigate, useLocation } from 'react-router-dom';

import { Account, getAccount, Permission } from '@/api/auth.ts';
import { AUTH_EXPIRED_EVENT, AUTH_REFRESH_EVENT } from '@/lib/auth-events.ts';

function toAccount(data: any): Account {
  return {
    username: data.username,
    role: data.role === 'admin' ? 'admin' : 'user',
    permissions: Array.isArray(data.permissions) ? data.permissions : []
  };
}

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const location = useLocation();

  // refreshAccount keeps the account state in sync without disturbing the
  // page: a permission change must not look like a reload. It never clears the
  // account, so a transient failure leaves the last known state in place.
  const refreshAccount = useCallback(() => {
    getAccount()
      .then((rsp) => {
        if (rsp.code !== 0 || !rsp.data?.username) return;
        const next = toAccount(rsp.data);
        setAccount((previous) => {
          if (
            previous &&
            previous.username === next.username &&
            previous.role === next.role &&
            previous.permissions.join() === next.permissions.join()
          ) {
            return previous;
          }
          return next;
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;

    getAccount()
      .then((rsp) => {
        if (!active) return;
        if (rsp.code !== 0 || !rsp.data?.username) {
          setIsAuthenticated(false);
          return;
        }

        setAccount(toAccount(rsp.data));
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
    window.addEventListener(AUTH_REFRESH_EVENT, refreshAccount);

    return () => {
      active = false;
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
      window.removeEventListener(AUTH_REFRESH_EVENT, refreshAccount);
    };
  }, [refreshAccount]);

  // A page without a long-lived connection (the settings tabs, for instance)
  // cannot be pushed a permission change, so it re-reads the account when the
  // route changes or when the page becomes visible again.
  const isFirstLocation = useRef(true);
  useEffect(() => {
    if (isFirstLocation.current) {
      isFirstLocation.current = false;
      return;
    }

    refreshAccount();
  }, [location.pathname, refreshAccount]);

  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshAccount();
      }
    };

    window.addEventListener('focus', handleVisible);
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      window.removeEventListener('focus', handleVisible);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [refreshAccount]);

  const hasPermission = useCallback(
    (permission: Permission) =>
      account?.role === 'admin' || !!account?.permissions.includes(permission),
    [account]
  );

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

  return <AuthContext.Provider value={{ account, hasPermission }}>{children}</AuthContext.Provider>;
};

// PermissionRoute keeps a page behind a grant. Losing the grant while the page
// is open sends the account back to the console, which then decides where it
// can go; the alternative is a page whose every request is refused.
export const PermissionRoute = ({
  permission,
  children
}: {
  permission: Permission;
  children: ReactNode;
}) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children : <Navigate to="/" replace />;
};

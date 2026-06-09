import { useEffect, useState } from 'react';
import * as api from '@/api/auth.ts';

export type Role = 'admin' | 'operator' | 'viewer' | 'loading';

export function useRole() {
  const [role, setRole] = useState<Role>('loading');

  useEffect(() => {
    api.getAccount().then((rsp: any) => {
      if (rsp.code === 0 && rsp.data?.role) {
        setRole(rsp.data.role as Role);
      } else {
        // Fallback: alles anzeigen wenn Rolle nicht ermittelt werden kann
        setRole('admin');
      }
    }).catch(() => {
      setRole('admin');
    });
  }, []);

  // Während Ladezeit alles anzeigen
  const loaded = role !== 'loading';

  return {
    role,
    isAdmin:    !loaded || role === 'admin',
    isOperator: !loaded || role === 'admin' || role === 'operator',
    isViewer:   loaded && role === 'viewer',
  };
}

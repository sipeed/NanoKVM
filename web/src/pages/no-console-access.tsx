import { useAuth } from '@/contexts/auth.ts';
import { Button, Flex, Result } from 'antd';
import { HardDriveIcon, LockIcon, TerminalSquareIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import * as api from '@/api/auth.ts';
import { Permission } from '@/api/auth.ts';
import { notifyAuthExpired } from '@/lib/auth-events.ts';
import { Head } from '@/components/head.tsx';

// The console is the landing page of the app, but it is not a requirement:
// an account may be granted only the media library or only the terminal. It
// lands here instead of on a black screen whose every request is refused, and
// is offered the pages its grants actually open.
export const NoConsoleAccess = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const pages: { permission: Permission; path: string; label: string; icon: JSX.Element }[] = [
    {
      permission: 'library.read',
      path: '/storage',
      label: t('head.storage'),
      icon: <HardDriveIcon size={16} />
    },
    {
      permission: 'terminal',
      path: '/terminal',
      label: t('head.terminal'),
      icon: <TerminalSquareIcon size={16} />
    }
  ];
  const destinations = pages.filter((page) => hasPermission(page.permission));

  function logout() {
    api.logout().then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      notifyAuthExpired();
      navigate('/auth/login');
    });
  }

  return (
    <>
      <Head title={t('head.desktop')} />

      <div className="flex h-full w-full items-center justify-center p-6">
        <Result
          icon={<LockIcon size={40} className="text-neutral-500" />}
          title={t('noConsole.title')}
          subTitle={destinations.length > 0 ? t('noConsole.description') : t('noConsole.nothing')}
          extra={
            <Flex vertical gap={8} className="mx-auto w-full max-w-[320px]">
              {destinations.map((destination) => (
                <Button
                  key={destination.path}
                  block
                  icon={destination.icon}
                  onClick={() => navigate(destination.path)}
                >
                  {destination.label}
                </Button>
              ))}
              <Button block onClick={() => navigate('/auth/password')}>
                {t('settings.account.updateBtn')}
              </Button>
              <Button block danger onClick={logout}>
                {t('settings.account.logoutBtn')}
              </Button>
            </Flex>
          }
        />
      </div>
    </>
  );
};

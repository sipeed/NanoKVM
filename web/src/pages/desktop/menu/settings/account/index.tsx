import { useAuth } from '@/contexts/auth.ts';
import { Button, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Logout } from './logout.tsx';
import { Users } from './users.tsx';

export const Account = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { account } = useAuth();

  function changePassword() {
    navigate('/auth/password');
  }

  return (
    <>
      <div className="text-base">{t('settings.account.title')}</div>
      <Divider className="opacity-50" />

      <div className="flex flex-col space-y-8">
        <div className="flex items-center justify-between">
          <span>{t('settings.account.webAccount')}</span>
          <span>{account.username}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>{t('settings.account.role')}</span>
          <span>{t(`settings.account.roles.${account.role}`)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>{t('settings.account.password')}</span>
          <Button type="primary" onClick={changePassword}>
            {t('settings.account.updateBtn')}
          </Button>
        </div>
      </div>

      <Divider className="opacity-50" />

      {account.role === 'admin' && (
        <>
          <Users />
          <Divider className="opacity-50" />
        </>
      )}

      <Logout />
    </>
  );
};

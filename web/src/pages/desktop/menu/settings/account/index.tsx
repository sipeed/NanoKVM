import { useEffect, useState } from 'react';
import { LogoutOutlined } from '@ant-design/icons';
import { Button, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import * as api from '@/api/auth.ts';
import { removeToken } from '@/lib/cookie.ts';

export const Account = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');

  useEffect(() => {
    api.getAccount().then((rsp) => {
      if (rsp.code === 0) {
        setUsername(rsp.data.username);
      }
    });
  }, []);

  function changePassword() {
    navigate('/auth/password');
  }

  function logout() {
    removeToken();
    navigate('/auth/login');
  }

  return (
    <>
      <div className="text-base font-bold">{t('settings.account.title')}</div>
      <Divider />

      <div className="flex flex-col space-y-5">
        <div className="flex items-center justify-between">
          <span>{t('settings.account.webAccount')}</span>
          <span>{username ? username : '-'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>{t('settings.account.password')}</span>
          <span
            className="cursor-pointer text-blue-500 hover:text-blue-500/80"
            onClick={changePassword}
          >
            {t('settings.account.updateBtn')}
          </span>
        </div>
      </div>
      <Divider />

      <div className="flex justify-center">
        <Button type="primary" danger icon={<LogoutOutlined />} onClick={logout}>
          {t('settings.account.logoutBtn')}
        </Button>
      </div>
    </>
  );
};

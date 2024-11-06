import { useEffect } from 'react';
import { Button, notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { isPasswordUpdated } from '@/api/auth.ts';
import { getSkipModifyPassword, setSkipModifyPassword } from '@/lib/localstorage.ts';

export const Notification = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const skip = getSkipModifyPassword();
    if (skip) return;

    isPasswordUpdated().then((rsp) => {
      if (rsp.code === 0 && !rsp.data.isUpdated) {
        openNotification();
      }
    });
  }, []);

  function openNotification() {
    api.info({
      message: t('auth.changePassword'),
      description: t('auth.changePasswordDesc'),
      placement: 'topRight',
      btn: <Button onClick={changePassword}>{t('auth.ok')}</Button>,
      duration: null,
      onClose: () => setSkipModifyPassword(true)
    });
  }

  function changePassword() {
    api.destroy();
    navigate('/auth/password');
  }

  return <>{contextHolder}</>;
};

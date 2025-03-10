import { LogoutOutlined } from '@ant-design/icons';
import { Button, Popconfirm } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import * as api from '@/api/auth.ts';
import { removeToken } from '@/lib/cookie.ts';

export const Logout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function logout() {
    api.logout().then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      removeToken();
      navigate('/auth/login');
    });
  }

  return (
    <div className="flex justify-center pt-3">
      <Popconfirm
        placement="bottom"
        title={t('settings.account.logoutDesc')}
        okText={t('settings.account.okBtn')}
        cancelText={t('settings.account.cancelBtn')}
        onConfirm={logout}
      >
        <Button danger type="primary" size="large" shape="round" icon={<LogoutOutlined />}>
          {t('settings.account.logoutBtn')}
        </Button>
      </Popconfirm>
    </div>
  );
};

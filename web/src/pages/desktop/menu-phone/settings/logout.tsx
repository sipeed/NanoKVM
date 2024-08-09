import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { removeToken } from '@/lib/cookie.ts';

export const Logout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  function logout() {
    removeToken();
    navigate('/auth/login');
  }

  return (
    <div
      className="flex cursor-pointer select-none items-center rounded px-3 py-1.5 hover:bg-neutral-600"
      onClick={logout}
    >
      {t('logout')}
    </div>
  );
};

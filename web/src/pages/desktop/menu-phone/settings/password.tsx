import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const Password = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  function changePassword() {
    navigate('/auth/password');
  }

  return (
    <div
      className="flex cursor-pointer select-none items-center rounded px-3 py-1.5 hover:bg-neutral-600"
      onClick={changePassword}
    >
      {t('changePassword')}
    </div>
  );
};

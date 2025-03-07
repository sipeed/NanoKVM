import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

export const MainError = () => {
  const { t } = useTranslation();

  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center space-y-5"
      role="alert"
    >
      <h2 className="text-lg font-semibold text-red-500">{t('error.title')}</h2>
      <Button type="primary" danger onClick={() => window.location.assign(window.location.origin)}>
        {t('error.refresh')}
      </Button>
    </div>
  );
};

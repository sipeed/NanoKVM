import { Switch } from 'antd';
import { useTranslation } from 'react-i18next';

export const HidMode = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span>{t('settings.device.hidOnly')}</span>
      </div>

      <Switch checked={true} disabled={true} />
    </div>
  );
};

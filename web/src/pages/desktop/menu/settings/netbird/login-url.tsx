import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

type LoginUrlProps = {
  url: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

// Shared by the Login panel and the Enable switch: both can receive an
// interactive login URL from `netbird up`, and dropping it strands the user on
// a device that is waiting for a browser authorization that never happens.
export const LoginUrl = ({ url, onConfirm, onCancel }: LoginUrlProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col items-center justify-center space-y-5">
      <Button type="link" href={url} target="_blank">
        {url}
      </Button>

      <span className="text-xs text-neutral-600">{t('settings.netbird.urlPeriod')}</span>

      <Button type="primary" size="large" shape="round" onClick={onConfirm}>
        {t('settings.netbird.loginSuccess')}
      </Button>

      {onCancel && (
        <Button type="text" size="small" onClick={onCancel}>
          {t('settings.netbird.cancelBtn')}
        </Button>
      )}
    </div>
  );
};

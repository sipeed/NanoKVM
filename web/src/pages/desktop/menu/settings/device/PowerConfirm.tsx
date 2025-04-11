import { useEffect, useState } from 'react';
import { Switch, Tooltip } from 'antd';
import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setPowerConfirm, getPowerConfirm } from '../../../../../lib/localstorage';

export const PowerConfirm = () => {
  const { t } = useTranslation();

  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    const cookieValue = getPowerConfirm();
    if (cookieValue === 'true') {
      setIsEnabled(true);
    }

    setIsLoading(false);

    }, []);

  function update() {
    if (isLoading) return;
    setIsLoading(true);

    const newValue = !isEnabled;
    setPowerConfirm(newValue);

    setIsLoading(false);
    setIsEnabled(!isEnabled);
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span>{t('settings.device.powerConfirm.title')}</span>

          <Tooltip
            title={t('settings.device.powerConfirm.tip')}
            className="cursor-pointer"
            placement="bottom"
            overlayStyle={{ maxWidth: '300px' }}
          >
            <CircleAlertIcon size={15} />
          </Tooltip>
        </div>
        <span className="text-xs text-neutral-500">{t('settings.device.powerConfirm.description')}</span>
      </div>

      <Switch checked={isEnabled} loading={isLoading} onChange={update} />
    </div>
  );
};

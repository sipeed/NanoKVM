import { useEffect, useState } from 'react';
import { Switch, Tooltip } from 'antd';
import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/application.ts';

interface PreviewProps {
  checkForUpdates: () => void;
}

export const Preview = ({ checkForUpdates }: PreviewProps) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    getPreviewUpdates();
  }, []);

  function getPreviewUpdates() {
    setIsLoading(true);

    api
      .getPreviewUpdates()
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setIsEnabled(rsp.data.enabled);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function setPreviewUpdates() {
    if (isLoading) return;
    setIsLoading(true);

    const enable = !isEnabled;

    api
      .setPreviewUpdates(enable)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setIsEnabled(enable);
        checkForUpdates();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span>{t('settings.update.preview')}</span>

          <Tooltip
            title={t('settings.update.previewTip')}
            className="cursor-pointer"
            placement="top"
            styles={{ root: { maxWidth: '400px' } }}
          >
            <CircleAlertIcon className="text-neutral-500" size={15} />
          </Tooltip>
        </div>

        <span className="text-xs text-neutral-500">{t('settings.update.previewDesc')}</span>
      </div>

      <Switch checked={isEnabled} loading={isLoading} onChange={setPreviewUpdates} />
    </div>
  );
};

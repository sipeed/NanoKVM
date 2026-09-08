import { useEffect, useState } from 'react';
import { Switch, Tooltip } from 'antd';
import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

const SERVICE_KEYS = ['ssdpd', 'dnsmasq'] as const;

export const Services = () => {
  const { t } = useTranslation();

  const [states, setStates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setIsLoading(true);
    api
      .getServices()
      .then((rsp) => {
        const map: Record<string, boolean> = {};
        if (rsp.data?.services) {
          for (const key of SERVICE_KEYS) {
            map[key] = rsp.data.services[key]?.enabled ?? false;
          }
        }
        setStates(map);
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }

  function toggle(key: string, enabled: boolean) {
    // Optimistic: flip immediately, revert on failure.
    setStates((prev) => ({ ...prev, [key]: enabled }));

    const req = enabled ? api.enableService(key) : api.disableService(key);
    req
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          setStates((prev) => ({ ...prev, [key]: !enabled }));
        }
      })
      .catch(() => {
        setStates((prev) => ({ ...prev, [key]: !enabled }));
      });
  }

  return (
    <div className="flex flex-col space-y-4">
      {SERVICE_KEYS.map((key) => (
        <div key={key} className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span>{t(`settings.network.services.${key}.title`)}</span>

              <Tooltip
                title={t(`settings.network.services.${key}.tip`)}
                className="cursor-pointer"
                placement="right"
                styles={{ root: { maxWidth: '400px' } }}
              >
                <CircleAlertIcon className="text-neutral-500" size={14} />
              </Tooltip>
            </div>
            <span className="text-xs text-neutral-500">
              {t(`settings.network.services.${key}.description`)}
            </span>
          </div>

          <Switch
            checked={states[key] ?? false}
            loading={isLoading}
            onChange={(checked) => toggle(key, checked)}
          />
        </div>
      ))}
    </div>
  );
};

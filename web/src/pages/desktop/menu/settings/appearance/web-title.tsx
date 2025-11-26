import { useEffect, useState } from 'react';
import { Input } from 'antd';
import { useAtom } from 'jotai';
import { GlobeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';
import { webTitleAtom } from '@/jotai/settings.ts';

export const WebTitle = () => {
  const { t } = useTranslation();
  const [webTitle, setWebTitle] = useAtom(webTitleAtom);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    api
      .getWebTitle()
      .then((rsp) => {
        if (rsp.data?.title) {
          setWebTitle(rsp.data.title);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  function submit() {
    if (isLoading) return;
    setIsLoading(true);

    api
      .setWebTitle(webTitle)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center space-x-1">
          <div className="flex size-[16px] items-center justify-center">
            <GlobeIcon size={14} />
          </div>
          <span>{t('settings.appearance.webTitle')}</span>
        </div>
        <span className="text-xs text-neutral-500">{t('settings.appearance.webTitleDesc')}</span>
      </div>

      <Input
        disabled={isLoading}
        style={{ width: 180 }}
        value={webTitle}
        onChange={(e) => setWebTitle(e.target.value)}
        onPressEnter={submit}
        onBlur={submit}
        placeholder="NanoKVM"
      />
    </div>
  );
};

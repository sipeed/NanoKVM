import { useEffect, useState } from 'react';
import { Input } from 'antd';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';
import { webTitleAtom } from '@/jotai/settings.ts';

export const WebTitle = () => {
  const { t } = useTranslation();
  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);
  const setWebTitle = useSetAtom(webTitleAtom);

  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('NanoKVM');

  useEffect(() => {
    setIsLoading(true);

    api
      .getWebTitle()
      .then((rsp) => {
        if (rsp.data?.title) {
          setTitle(rsp.data.title);
          setWebTitle(rsp.data.title);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  function update() {
    if (isLoading) return;
    setIsLoading(true);

    api
      .setWebTitle(title)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setWebTitle(title === 'NanoKVM' ? '' : title);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span>{t('settings.appearance.webTitle')}</span>
        </div>
        <span className="text-xs text-neutral-500">{t('settings.appearance.webTitleDesc')}</span>
      </div>

      <Input
        disabled={isLoading}
        onFocus={() => setIsKeyboardEnable(false)}
        onBlur={() => setIsKeyboardEnable(true)}
        style={{ width: 180 }}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onPressEnter={update}
      />
    </div>
  );
};

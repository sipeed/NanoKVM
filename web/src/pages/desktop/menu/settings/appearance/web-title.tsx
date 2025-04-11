import { useEffect, useState } from 'react';
import { Input, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';
import { useSetAtom } from 'jotai';

import * as api from '@/api/vm.ts';
import { LoadingOutlined } from '@ant-design/icons';

export const WebTitle = () => {

    const { t } = useTranslation();
    const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);
    const [isLoading, setIsLoading] = useState(false);
    const [webTitle, setWebTitle] = useState("");
    const [messageApi, contextHolder] = message.useMessage();
    useEffect(() => {
        setIsLoading(true);

        api
        .getWebTitle()
            .then((rsp) => {
                if (rsp.data?.webTitle) {
                    setWebTitle(rsp.data?.webTitle.toString());
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

  
    async function update() {
        if (isLoading) return;
        setIsLoading(true);

        const rsp = await api.setWebTitle(webTitle);

        if (rsp.code !== 0) {
            console.log(rsp.msg);
            messageApi.error(t('settings.appearance.webTitle.error') + ":" + rsp.msg);
            return;
        }else{
          messageApi.success(t('settings.appearance.webTitle.success'));
        }

        setIsLoading(false);
    }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span>{t('settings.appearance.webTitle.title')}</span>
        </div>
        <span className="text-xs text-neutral-500">{t('settings.appearance.webTitle.description')}</span>
      </div>
      {!isLoading ? <Input onFocus={() => setIsKeyboardEnable(false)} onBlur={() => setIsKeyboardEnable(true)} style={{ width: 180 }} value={webTitle} onChange={(e) => setWebTitle(e.target.value)} onPressEnter={update} /> : <LoadingOutlined />}
      {contextHolder}
    </div>

  );
};



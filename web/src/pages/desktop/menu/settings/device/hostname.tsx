import { useEffect, useState } from 'react';
import { Input, Tooltip, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { CircleAlertIcon } from 'lucide-react';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';
import { useSetAtom } from 'jotai';

import * as api from '@/api/vm.ts';
import { LoadingOutlined } from '@ant-design/icons';

export const Hostname = () => {

    const { t } = useTranslation();
    const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);
    const [isLoading, setIsLoading] = useState(false);
    const [hostname, setHostname] = useState("");
    const [messageApi, contextHolder] = message.useMessage();
    useEffect(() => {
        setIsLoading(true);

        api
        .getHostname()
            .then((rsp) => {
                if (rsp.data?.hostname) {
                    setHostname(rsp.data?.hostname.toString());
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

  
    async function update() {
        if (isLoading) return;
        setIsLoading(true);

        const rsp = await api.setHostname(hostname);

        if (rsp.code !== 0) {
            console.log(rsp.msg);
            messageApi.error(t('settings.device.hostname.error') + ":" + rsp.msg);
            return;
        }else{
            messageApi.success(t('settings.device.hostname.success'));
        }
        setIsLoading(false);
    }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
            <span>{t('settings.device.hostname.title')}</span>

          <Tooltip
            title={t('settings.device.hostname.tip')}
            className="cursor-pointer"
            placement="bottom"
            overlayStyle={{ maxWidth: '300px' }}
          >
            <CircleAlertIcon size={15} />
          </Tooltip>
        </div>
              <span className="text-xs text-neutral-500">{t('settings.device.hostname.description')}</span>
      </div>
      {!isLoading ? <Input onFocus={() => setIsKeyboardEnable(false)} onBlur={() => setIsKeyboardEnable(true)} style={{ width: 150 }} value={hostname} onChange={(e) => setHostname(e.target.value)} onPressEnter={update} /> : <LoadingOutlined />}
          {contextHolder}
    </div>

  );
};



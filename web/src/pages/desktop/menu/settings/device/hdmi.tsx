import { useEffect, useState } from 'react';
import { Switch } from 'antd';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';
import { isHdmiEnabledAtom } from '@/jotai/screen.ts';

export const Hdmi = () => {
  const { t } = useTranslation();

  const [isHdmiEnabled, setIsHdmiEnabled] = useAtom(isHdmiEnabledAtom);

  const [isPcie, setIsPcie] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getHardware();
    getHdmiState();
  }, []);

  async function getHardware() {
    const rsp = await api.getHardware();
    if (rsp.code !== 0) {
      return;
    }

    setIsPcie(rsp.data?.version === 'PCIE');
  }

  async function getHdmiState() {
    setIsLoading(true);

    const rsp = await api.getHdmiState();
    if (rsp.code === 0) {
      setIsHdmiEnabled(rsp.data.enabled);
    }

    setIsLoading(false);
  }

  async function setHdmiState() {
    if (isLoading) return;
    setIsLoading(true);

    const enabled = !isHdmiEnabled;

    const rsp = await api.setHdmiState(enabled);
    if (rsp.code !== 0) {
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      setIsHdmiEnabled(enabled);
      setIsLoading(false);
    }, 1000);
  }

  return (
    <>
      {isPcie && (
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <span>HDMI</span>

            <span className="text-xs text-neutral-500">
              {t('settings.device.hdmi.description')}
            </span>
          </div>

          <Switch checked={isHdmiEnabled} loading={isLoading} onChange={setHdmiState} />
        </div>
      )}
    </>
  );
};

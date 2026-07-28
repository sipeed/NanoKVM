import { useEffect, useState } from 'react';
import { InputNumber, Switch } from 'antd';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';
import { isHdmiEnabledAtom } from '@/jotai/screen.ts';

export const Hdmi = () => {
  const { t } = useTranslation();

  const [isHdmiEnabled, setIsHdmiEnabled] = useAtom(isHdmiEnabledAtom);

  const [isPcie, setIsPcie] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [idleTimeout, setIdleTimeout] = useState(0);
  const [idleTimeoutInput, setIdleTimeoutInput] = useState<number | null>(0);
  const [isIdleTimeoutLoading, setIsIdleTimeoutLoading] = useState(false);

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
      const timeout = rsp.data.idleTimeout ?? 0;
      setIdleTimeout(timeout);
      setIdleTimeoutInput(timeout);
    }

    setIsLoading(false);
  }

  function updateIdleTimeout() {
    if (
      isIdleTimeoutLoading ||
      idleTimeoutInput === null ||
      idleTimeoutInput < 0 ||
      idleTimeoutInput === idleTimeout
    ) {
      return;
    }

    setIsIdleTimeoutLoading(true);
    api
      .setHdmiIdleTimeout(idleTimeoutInput)
      .then((rsp) => {
        if (rsp.code !== 0) {
          setIdleTimeoutInput(idleTimeout);
          return;
        }

        setIdleTimeout(idleTimeoutInput);
      })
      .finally(() => {
        setIsIdleTimeoutLoading(false);
      });
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
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <span>HDMI</span>

              <span className="text-xs text-neutral-500">
                {t('settings.device.hdmi.description')}
              </span>
            </div>

            <Switch checked={isHdmiEnabled} loading={isLoading} onChange={setHdmiState} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <span>{t('settings.device.hdmi.idleTimeoutTitle')}</span>
              <span className="text-xs text-neutral-500">
                {t('settings.device.hdmi.idleTimeoutDescription')}
              </span>
            </div>

            <InputNumber
              style={{ width: 150 }}
              min={0}
              precision={0}
              value={idleTimeoutInput}
              addonAfter={t('settings.device.hdmi.minutes')}
              disabled={isIdleTimeoutLoading}
              onChange={setIdleTimeoutInput}
              onBlur={updateIdleTimeout}
              onPressEnter={updateIdleTimeout}
            />
          </div>
        </div>
      )}
    </>
  );
};

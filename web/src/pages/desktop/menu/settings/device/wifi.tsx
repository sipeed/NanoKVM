import { useEffect, useState } from 'react';
import { LockOutlined, WifiOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Switch } from 'antd';
import { WifiIcon, WifiPenIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';
import { message } from 'antd';

export const Wifi = () => {
  const { t } = useTranslation();

  const [isSupported, setIsSupported] = useState(false);
  const [isAPMode, setIsAPMode] = useState(false);
  const [connectedWiFi, setConnectedWifi] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'' | 'connecting' | 'disconnecting'>('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getWiFi();
  }, []);

  async function getWiFi() {
    try {
      const rsp = await api.getWiFi();
      if (rsp.code !== 0) {
         const errorMessage = t('settings.device.wifi.failed');
         message.error(errorMessage as any);
         return;
       }

       setIsSupported(!!rsp.data?.supported);
       setIsAPMode(!!rsp.data?.apMode);

       if (rsp.data?.connected && rsp.data?.ssid) {
         setConnectedWifi(rsp.data.ssid);
       } else {
         setConnectedWifi('');
       }
     } catch (err) {
       message.error(t('settings.device.wifi.failed'));
     }
   }

  async function connect() {
    setMessage('');

    if (!ssid || !password) return;

    if (status !== '') return;
    setStatus('connecting');

    try {
      const rsp = await api.connectWifi(ssid, password);
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        setMessage(t('settings.device.wifi.failed'));
        getWiFi();
        return;
      }

      setConnectedWifi(ssid);
      setIsModalOpen(false);
    } catch (err) {
      // @ts-expect-error - err IS used below in message.error(), TS false positive
      const errorMessage = t('settings.device.wifi.failed');
      message.error(errorMessage as any);
    } finally {
      setStatus('');
    }
  }

  async function disconnect(enable: boolean) {
    if (enable || status !== '') return;

    setStatus('disconnecting');

    try {
      const rsp = await api.disconnectWifi();
      if (rsp.code !== 0) {
        // @ts-ignore - t() returns TFunction, TS false positive with Property 'error'
        const errorMessage = t('settings.device.wifi.failed');
        message.error(errorMessage as any);
        return;
      }

      setConnectedWifi('');
    } catch (err) {
      message.error(t('settings.device.wifi.failed'));
    } finally {
      setStatus('');
    }
  }

  async function disconnect(enable: boolean) {
    if (enable || status !== '') return;

    setStatus('disconnecting');

    try {
      const rsp = await api.disconnectWifi();
      if (rsp.code !== 0) {
        message.error(t('settings.device.wifi.failed'));
        return;
      }

      setConnectedWifi('');
    } catch (err) {
      message.error(t('settings.device.wifi.failed'));
    } finally {
      setStatus('');
    }
  }
  }

  function openModal() {
    setSsid('');
    setPassword('');
    setMessage('');
    setIsModalOpen(true);
  }

  function closeModal() {
    if (status !== '') return;
    setIsModalOpen(false);
  }

  if (!isSupported) {
    return <></>;
  }

  if (isAPMode) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span>{t('settings.device.wifi.title')}</span>
          <span className="text-xs text-neutral-500">{t('settings.device.wifi.apMode')}</span>
        </div>

        <Button shape="round" size="small" disabled>
          <div className="flex items-center justify-center px-1.5">
            <WifiIcon size={16} />
          </div>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('settings.device.wifi.title')}</span>
          <span className="text-xs text-neutral-500">{t('settings.device.wifi.description')}</span>
        </div>

        <Button
          type={connectedWiFi ? 'primary' : 'default'}
          shape="round"
          size="small"
          onClick={openModal}
        >
          <div className="flex items-center justify-center px-1.5">
            <WifiIcon size={16} />
          </div>
        </Button>
      </div>

      <Modal
        closable={false}
        open={isModalOpen}
        centered={true}
        onOk={connect}
        onCancel={closeModal}
        okText={t('settings.device.wifi.joinBtn')}
        cancelText={t('settings.device.wifi.cancelBtn')}
        confirmLoading={status === 'connecting'}
      >
        {/* title */}
        <div className="flex items-center space-x-5">
          <div className="h-[64px] w-[64px]">
            <WifiPenIcon size={64} className="text-blue-400" />
          </div>

          {!connectedWiFi ? (
            <div className="flex flex-col">
              <span className="text-lg font-bold">{t('settings.device.wifi.connect')}</span>
              <span className="text-xs text-neutral-400">
                {t('settings.device.wifi.connectDesc1')}
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex w-[300px] justify-between rounded-lg bg-neutral-800">
                <div className="flex w-full justify-between p-3">
                  <span>{connectedWiFi}</span>
                  <Switch
                    value={!!connectedWiFi}
                    loading={status === 'disconnecting'}
                    onChange={disconnect}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* form */}
        <div className="flex flex-col items-center space-y-3 py-6">
          <Input
            value={ssid}
            style={{ width: '300px' }}
            prefix={<WifiOutlined />}
            placeholder={t('settings.device.wifi.ssid')}
            onChange={(e) => setSsid(e.target.value)}
          />
          <Input.Password
            value={password}
            style={{ width: '300px' }}
            prefix={<LockOutlined />}
            placeholder={t('settings.device.wifi.password')}
            onChange={(e) => setPassword(e.target.value)}
          />

          {!!message && <span className="text-sm text-red-500">{message}</span>}
        </div>
      </Modal>
    </>
  );
};

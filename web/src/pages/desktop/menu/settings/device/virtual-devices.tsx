import { useEffect, useState } from 'react';
import { Button, Divider, Modal, Switch, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

import { getHidMode } from '@/api/hid.ts';
import * as api from '@/api/virtual-device.ts';

const { Paragraph } = Typography;

export const VirtualDevices = () => {
  const { t } = useTranslation();

  const [isHidOnlyMode, setIsHidOnlyMode] = useState(false);
  const [isDiskEnabled, setIsDiskEnabled] = useState(false);
  const [isNetworkEnabled, setIsNetworkEnabled] = useState(false);
  const [isSerialEnabled, setIsSerialEnabled] = useState(false);
  const [loading, setLoading] = useState<'' | 'disk' | 'network' | 'serial'>('');

  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [serialErrMsg, setSerialErrMsg] = useState('');

  useEffect(() => {
    getHidOnlyMode();
    getVirtualDevice();
  }, []);

  async function getHidOnlyMode() {
    try {
      const rsp = await getHidMode();
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }
      setIsHidOnlyMode(rsp.data.mode === 'hid-only');
    } catch (err) {
      console.log(err);
    }
  }

  async function getVirtualDevice() {
    try {
      const rsp = await api.getVirtualDevice();
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setIsDiskEnabled(rsp.data.disk);
      setIsNetworkEnabled(rsp.data.network);
      setIsSerialEnabled(!!rsp.data.serial);
    } catch (err) {
      console.log(err);
    }
  }

  async function update(device: 'disk' | 'network') {
    if (loading) return;
    setLoading(device);

    try {
      const rsp = await api.updateVirtualDevice(device);
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      await getVirtualDevice();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading('');
    }
  }

  function updateSerial() {
    if (loading) return;
    setLoading('serial');
    setSerialErrMsg('');

    const timeoutId = setTimeout(() => {
      window.location.reload();
    }, 30000);

    api
      .updateVirtualDevice('serial')
      .then((rsp) => {
        if (rsp.code !== 0) {
          setSerialErrMsg(rsp.msg);
          setLoading('');
          clearTimeout(timeoutId);
        }
      })
      .catch((err) => {
        console.log(err);
        setLoading('');
        clearTimeout(timeoutId);
      });
  }

  const serialRow = (
    <div className="flex items-center justify-between">
      <div className="flex flex-col space-y-1">
        <span>{t('settings.device.usbSerial')}</span>
        <span className="text-xs text-neutral-500">{t('settings.device.usbSerialDesc')}</span>
      </div>

      <Switch
        checked={isSerialEnabled}
        loading={loading === 'serial'}
        onChange={() => setIsSerialModalOpen(true)}
      />
    </div>
  );

  const serialModal = (
    <Modal
      open={isSerialModalOpen}
      title={t('settings.device.usbSerialModal.title')}
      width={580}
      centered={false}
      footer={false}
      onCancel={() => setIsSerialModalOpen(false)}
    >
      <Divider />

      <Paragraph>
        {isSerialEnabled
          ? t('settings.device.usbSerialModal.descDisable')
          : t('settings.device.usbSerialModal.descEnable')}
      </Paragraph>

      <Paragraph type="secondary">
        <ul>
          <li>{t('settings.device.usbSerialModal.tip1')}</li>
          <li>{t('settings.device.usbSerialModal.tip2')}</li>
          <li>{t('settings.device.usbSerialModal.tip3')}</li>
          <li>{t('settings.device.usbSerialModal.tip4')}</li>
        </ul>
      </Paragraph>

      {serialErrMsg && <div className="pt-1 text-sm text-red-500">{serialErrMsg}</div>}

      <div className="flex justify-center pt-5">
        <Button
          danger
          type="primary"
          loading={loading === 'serial'}
          onClick={() => {
            setIsSerialModalOpen(false);
            updateSerial();
          }}
        >
          {isSerialEnabled
            ? t('settings.device.usbSerialModal.disable')
            : t('settings.device.usbSerialModal.enable')}
        </Button>
      </div>
    </Modal>
  );

  if (isHidOnlyMode) {
    return (
      <>
        <div className="flex items-center justify-between space-x-10">
          <div className="flex flex-col space-y-1">
            <span>{t('settings.device.hidOnly')}</span>
            <span className="text-xs text-neutral-500">{t('settings.device.hidOnlyDesc')}</span>
          </div>

          <Switch checked={true} disabled={true} />
        </div>

        {serialRow}
        {serialModal}
      </>
    );
  }

  return (
    <>
      {/* Virtual Disk */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('settings.device.disk')}</span>
          <span className="text-xs text-neutral-500">{t('settings.device.diskDesc')}</span>
        </div>

        <Switch
          checked={isDiskEnabled}
          loading={loading === 'disk'}
          onChange={() => update('disk')}
        />
      </div>

      {/* Virtual Network */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('settings.device.network')}</span>
          <span className="text-xs text-neutral-500">{t('settings.device.networkDesc')}</span>
        </div>

        <Switch
          checked={isNetworkEnabled}
          loading={loading === 'network'}
          onChange={() => update('network')}
        />
      </div>

      {serialRow}
      {serialModal}
    </>
  );
};

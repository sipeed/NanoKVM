import { useEffect, useState } from 'react';
import { Button, Input, message, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/usb-identity.ts';

const VID_PID_PATTERN = /^0x[0-9a-fA-F]{4}$/;
const STRING_PATTERN = /^[\x20-\x7E]{0,32}$/;

const emptyForm = {
  vendorId: '',
  productId: '',
  manufacturer: '',
  product: '',
  serial: ''
};

export const UsbIdentity = () => {
  const { t } = useTranslation();

  const [form, setForm] = useState(emptyForm);
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchIdentity();
  }, []);

  async function fetchIdentity() {
    setIsLoading(true);

    try {
      const rsp = await api.getUsbIdentity();
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setForm({
        vendorId: rsp.data.vendorId,
        productId: rsp.data.productId,
        manufacturer: rsp.data.manufacturer,
        product: rsp.data.product,
        serial: rsp.data.serial
      });
      setIsCustom(rsp.data.isCustom);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }

  function validate(): boolean {
    if (form.vendorId && !VID_PID_PATTERN.test(form.vendorId)) {
      message.error(t('settings.device.usbIdentity.invalidId'));
      return false;
    }
    if (form.productId && !VID_PID_PATTERN.test(form.productId)) {
      message.error(t('settings.device.usbIdentity.invalidId'));
      return false;
    }
    for (const value of [form.manufacturer, form.product, form.serial]) {
      if (value && !STRING_PATTERN.test(value)) {
        message.error(t('settings.device.usbIdentity.invalidString'));
        return false;
      }
    }
    return true;
  }

  async function submit(next = form) {
    if (isSaving || !validate()) return;
    setIsSaving(true);

    try {
      const rsp = await api.setUsbIdentity(next);
      if (rsp.code !== 0) {
        message.error(rsp.msg || t('settings.device.usbIdentity.saveFailed'));
        return;
      }

      message.success(t('settings.device.usbIdentity.saved'));
      await fetchIdentity();
    } catch (err) {
      console.log(err);
      message.error(t('settings.device.usbIdentity.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  function resetToDefault() {
    setForm(emptyForm);
    submit(emptyForm);
  }

  function field(key: keyof typeof form, label: string, placeholder: string) {
    return (
      <div className="flex items-center justify-between space-x-5">
        <span className="text-xs text-neutral-500">{label}</span>
        <Input
          disabled={isLoading || isSaving}
          style={{ width: 200 }}
          value={form[key]}
          placeholder={placeholder}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          onPressEnter={() => submit()}
          onBlur={() => submit()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between space-x-10">
        <div className="flex flex-col space-y-1">
          <span className="flex items-center space-x-1">
            <span>{t('settings.device.usbIdentity.title')}</span>
            <Tooltip title={t('settings.device.usbIdentity.tooltip')}>
              <InfoCircleOutlined className="text-neutral-500" />
            </Tooltip>
          </span>
          <span className="text-xs text-neutral-500">
            {t('settings.device.usbIdentity.description')}
          </span>
        </div>

        <Button size="small" disabled={!isCustom || isSaving} onClick={resetToDefault}>
          {t('settings.device.usbIdentity.reset')}
        </Button>
      </div>

      <div className="flex flex-col space-y-3 pl-1">
        {field('vendorId', t('settings.device.usbIdentity.vendorId'), '0x3346')}
        {field('productId', t('settings.device.usbIdentity.productId'), '0x1009')}
        {field('manufacturer', t('settings.device.usbIdentity.manufacturer'), 'sipeed')}
        {field('product', t('settings.device.usbIdentity.product'), 'NanoKVM')}
        {field('serial', t('settings.device.usbIdentity.serial'), '0123456789ABCDEF')}
      </div>

      <span className="text-xs text-neutral-500">
        {t('settings.device.usbIdentity.applyNote')}
      </span>
    </div>
  );
};

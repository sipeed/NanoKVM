import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Divider, Input, Modal, Select, message } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/usb-descriptor.ts';

import { presets } from './presets.ts';

type Descriptor = {
  vendorName: string;
  productName: string;
  serialNumber: string;
  vid: string;
  pid: string;
};

const emptyDescriptor: Descriptor = {
  vendorName: '',
  productName: '',
  serialNumber: '',
  vid: '0x0000',
  pid: '0x0000'
};

function randomSerial(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function isValidHex(value: string): boolean {
  return /^0x[0-9A-Fa-f]{1,4}$/.test(value);
}

export const UsbDescriptor = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalDescriptor, setOriginalDescriptor] = useState<Descriptor>(emptyDescriptor);
  const [editedDescriptor, setEditedDescriptor] = useState<Descriptor>(emptyDescriptor);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [error, setError] = useState('');

  const readDescriptor = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rsp = await api.getUsbDescriptor();
      if (rsp.code !== 0) {
        setError(rsp.msg);
        return;
      }
      const desc: Descriptor = rsp.data.descriptor;
      setOriginalDescriptor(desc);
      setEditedDescriptor(desc);

      const matchingPreset = presets.find(
        (p) =>
          p.descriptor.vendorName === desc.vendorName &&
          p.descriptor.productName === desc.productName &&
          p.descriptor.vid.toLowerCase() === desc.vid.toLowerCase() &&
          p.descriptor.pid.toLowerCase() === desc.pid.toLowerCase()
      );
      setSelectedPreset(matchingPreset ? matchingPreset.id : 'custom');
    } catch {
      setError(t('settings.device.usbDescriptor.errors.readFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    readDescriptor();
  }, [readDescriptor]);

  const hasChanges = useMemo(() => {
    return (
      editedDescriptor.vendorName !== originalDescriptor.vendorName ||
      editedDescriptor.productName !== originalDescriptor.productName ||
      editedDescriptor.serialNumber !== originalDescriptor.serialNumber ||
      editedDescriptor.vid !== originalDescriptor.vid ||
      editedDescriptor.pid !== originalDescriptor.pid
    );
  }, [editedDescriptor, originalDescriptor]);

  const vidPidChanged = useMemo(() => {
    return (
      editedDescriptor.vid !== originalDescriptor.vid ||
      editedDescriptor.pid !== originalDescriptor.pid
    );
  }, [editedDescriptor, originalDescriptor]);

  function updateField(field: keyof Descriptor, value: string): void {
    setEditedDescriptor((prev) => ({ ...prev, [field]: value }));
    setSelectedPreset('custom');
  }

  function handlePresetChange(presetId: string): void {
    setSelectedPreset(presetId);
    if (presetId === 'custom') return;

    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setEditedDescriptor((prev) => ({
        ...prev,
        vendorName: preset.descriptor.vendorName,
        productName: preset.descriptor.productName,
        vid: preset.descriptor.vid,
        pid: preset.descriptor.pid
      }));
    }
  }

  function handleRandomSerial(): void {
    const serial = randomSerial();
    setEditedDescriptor((prev) => ({ ...prev, serialNumber: serial }));
    setSelectedPreset('custom');
  }

  async function handleApply(): Promise<void> {
    if (!isValidHex(editedDescriptor.vid) || !isValidHex(editedDescriptor.pid)) {
      setError(t('settings.device.usbDescriptor.errors.invalidHex'));
      return;
    }

    if (vidPidChanged) {
      setConfirmModalOpen(true);
      return;
    }
    await applyChanges();
  }

  async function applyChanges(): Promise<void> {
    setConfirmModalOpen(false);
    setSaving(true);
    setError('');
    try {
      const rsp = await api.setUsbDescriptor(editedDescriptor);
      if (rsp.code !== 0) {
        setError(rsp.msg);
        return;
      }
      message.success(t('settings.device.usbDescriptor.applySuccess'));
      await readDescriptor();
    } catch {
      setError(t('settings.device.usbDescriptor.errors.writeFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(): Promise<void> {
    setSaving(true);
    setError('');
    try {
      const rsp = await api.restoreUsbDefaults();
      if (rsp.code !== 0) {
        setError(rsp.msg);
        return;
      }
      message.success(t('settings.device.usbDescriptor.restoreSuccess'));
      await readDescriptor();
    } catch {
      setError(t('settings.device.usbDescriptor.errors.restoreFailed'));
    } finally {
      setSaving(false);
    }
  }

  const presetOptions = [
    {
      label: t('settings.device.usbDescriptor.presetGroups.generic'),
      options: presets
        .filter((p) => p.group === 'generic')
        .map((p) => ({ value: p.id, label: t(p.labelKey) }))
    },
    {
      label: t('settings.device.usbDescriptor.presetGroups.brand'),
      options: presets
        .filter((p) => p.group === 'brand')
        .map((p) => ({ value: p.id, label: t(p.labelKey) }))
    },
    {
      label: '',
      options: [{ value: 'custom', label: t('settings.device.usbDescriptor.presetGroups.custom') }]
    }
  ];

  const vendorLen = editedDescriptor.vendorName.length;
  const productLen = editedDescriptor.productName.length;
  const serialLen = editedDescriptor.serialNumber.length;
  const maxLen = 126;

  return (
    <>
      <div className="flex flex-col space-y-1">
        <span>{t('settings.device.usbDescriptor.title')}</span>
        <span className="text-xs text-neutral-500">
          {t('settings.device.usbDescriptor.description')}
        </span>
      </div>

      <div className="space-y-4 pt-2">
        {error && (
          <div className="rounded-lg border border-red-600/30 bg-red-600/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Preset selector */}
        <div className="flex items-center justify-between">
          <span>{t('settings.device.usbDescriptor.preset')}</span>
          <Select
            value={selectedPreset}
            style={{ width: 240 }}
            options={presetOptions}
            onChange={handlePresetChange}
            loading={loading}
          />
        </div>

        <Divider className="opacity-50" />

        {/* Vendor Name */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span>{t('settings.device.usbDescriptor.vendorName')}</span>
            <span className="text-xs text-neutral-500">
              {vendorLen}/{maxLen} {t('settings.device.usbDescriptor.chars')}
            </span>
          </div>
          <Input
            value={editedDescriptor.vendorName}
            style={{ width: 240 }}
            maxLength={maxLen}
            status={vendorLen > maxLen ? 'error' : undefined}
            onChange={(e) => updateField('vendorName', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Product Name */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span>{t('settings.device.usbDescriptor.productName')}</span>
            <span className="text-xs text-neutral-500">
              {productLen}/{maxLen} {t('settings.device.usbDescriptor.chars')}
            </span>
          </div>
          <Input
            value={editedDescriptor.productName}
            style={{ width: 240 }}
            maxLength={maxLen}
            status={productLen > maxLen ? 'error' : undefined}
            onChange={(e) => updateField('productName', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Serial Number */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span>{t('settings.device.usbDescriptor.serialNumber')}</span>
            <span className="text-xs text-neutral-500">
              {serialLen}/{maxLen} {t('settings.device.usbDescriptor.chars')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              value={editedDescriptor.serialNumber}
              style={{ width: 170 }}
              maxLength={maxLen}
              status={serialLen > maxLen ? 'error' : undefined}
              onChange={(e) => updateField('serialNumber', e.target.value)}
              disabled={loading}
            />
            <Button size="small" onClick={handleRandomSerial} disabled={loading}>
              {t('settings.device.usbDescriptor.randomize')}
            </Button>
          </div>
        </div>

        <Divider className="opacity-50" />

        {/* VID */}
        <div className="flex items-center justify-between">
          <span>VID</span>
          <Input
            value={editedDescriptor.vid}
            style={{ width: 240 }}
            onChange={(e) => updateField('vid', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* PID */}
        <div className="flex items-center justify-between">
          <span>PID</span>
          <Input
            value={editedDescriptor.pid}
            style={{ width: 240 }}
            onChange={(e) => updateField('pid', e.target.value)}
            disabled={loading}
          />
        </div>

        {vidPidChanged && (
          <div className="rounded-lg border border-amber-600/30 bg-amber-600/10 p-3 text-sm text-amber-400">
            {t('settings.device.usbDescriptor.vidPidWarning')}
          </div>
        )}

        <Divider className="opacity-50" />

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button onClick={readDescriptor} disabled={loading || saving}>
              {t('settings.device.usbDescriptor.readDevice')}
            </Button>
            <Button danger onClick={handleRestore} disabled={loading || saving}>
              {t('settings.device.usbDescriptor.restoreDefaults')}
            </Button>
          </div>
          <Button
            type="primary"
            onClick={handleApply}
            disabled={!hasChanges || loading || saving}
            loading={saving}
          >
            {t('settings.device.usbDescriptor.apply')}
          </Button>
        </div>
      </div>

      {/* VID/PID confirmation modal */}
      <Modal
        title={t('settings.device.usbDescriptor.confirmTitle')}
        open={confirmModalOpen}
        onOk={applyChanges}
        onCancel={() => setConfirmModalOpen(false)}
        okText={t('settings.device.usbDescriptor.confirm')}
        cancelText={t('settings.device.usbDescriptor.cancel')}
        okButtonProps={{ danger: true }}
      >
        <p>{t('settings.device.usbDescriptor.confirmMessage')}</p>
      </Modal>
    </>
  );
};

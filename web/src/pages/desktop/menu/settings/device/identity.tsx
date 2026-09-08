import { useEffect, useState } from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { ClipboardPenIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

type IdentityRowProps = {
  label: string;
  description: string;
  defaultValue: string;
  get: () => Promise<{ data?: { [key: string]: string } }>;
  set: (value: string) => Promise<{ code: number; msg?: string }>;
  savedLabel: string;
};

const IdentityRow = ({ label, description, defaultValue, get, set, savedLabel }: IdentityRowProps) => {
  const [current, setCurrent] = useState('');
  const [editState, setEditState] = useState<'' | 'editing' | 'edited'>('');
  const [input, setInput] = useState('');

  useEffect(() => {
    get().then((rsp) => {
      const first = Object.values(rsp.data ?? {})[0];
      if (first) {
        setCurrent(first);
      }
    });
  }, [get]);

  function showInput() {
    setInput(current);
    setEditState('editing');
  }

  function update() {
    if (input === current) {
      setEditState('');
      return;
    }

    set(input).then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }
      setCurrent(input);
      setEditState('edited');
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{label}</span>
          <span className="text-xs text-neutral-500">{description}</span>
        </div>

        {editState === 'editing' ? (
          <div className="flex items-center space-x-1">
            <Input style={{ width: 150 }} value={input} onChange={(e) => setInput(e.target.value)} />
            <Button size="small" icon={<CheckOutlined />} onClick={update} />
            <Button size="small" icon={<CloseOutlined />} onClick={() => setEditState('')} />
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span>{current || defaultValue}</span>
            <div className="size-[16px] cursor-pointer text-neutral-500 hover:text-blue-500" onClick={showInput}>
              <ClipboardPenIcon size={16} />
            </div>
          </div>
        )}
      </div>

      {editState === 'edited' && (
        <div className="flex w-full justify-end text-xs text-green-500">{savedLabel}</div>
      )}
    </div>
  );
};

export const Identity = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-4">
      <IdentityRow
        label={t('settings.device.identity.name')}
        description={t('settings.device.identity.nameDesc')}
        defaultValue="NanoKVM"
        get={api.getHostname}
        set={api.setHostname}
        savedLabel={t('settings.device.identity.saved')}
      />
      <IdentityRow
        label={t('settings.device.identity.vendor')}
        description={t('settings.device.identity.vendorDesc')}
        defaultValue="sipeed"
        get={api.getDeviceVendor}
        set={api.setDeviceVendor}
        savedLabel={t('settings.device.identity.saved')}
      />
      <IdentityRow
        label={t('settings.device.identity.serial')}
        description={t('settings.device.identity.serialDesc')}
        defaultValue="0123456789ABCDEF"
        get={api.getDeviceSerial}
        set={api.setDeviceSerial}
        savedLabel={t('settings.device.identity.saved')}
      />
    </div>
  );
};

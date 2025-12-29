import { useEffect, useState } from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { ClipboardPenIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

export const Hostname = () => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [hostname, setHostname] = useState('');

  const [editState, setEditState] = useState<'' | 'editing' | 'edited'>('');
  const [input, setInput] = useState('');

  useEffect(() => {
    getHostname();
  }, []);

  function getHostname() {
    setIsLoading(true);

    api
      .getHostname()
      .then((rsp) => {
        if (rsp.data?.hostname) {
          setHostname(rsp.data?.hostname);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function showInput() {
    setInput(hostname);
    setEditState('editing');
  }

  function update() {
    if (input === hostname) {
      setEditState('');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    api
      .setHostname(input)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        setHostname(input);
        setEditState('edited');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="space-y-1">
      <div className="flex w-full items-center justify-between">
        <span>{t('settings.about.hostname')}</span>

        {editState === 'editing' ? (
          <div className="flex items-center space-x-1">
            <Input
              disabled={isLoading}
              style={{ width: 150 }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button size="small" icon={<CheckOutlined />} onClick={update} />
            <Button size="small" icon={<CloseOutlined />} onClick={() => setEditState('')} />
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span>{hostname}</span>
            <div
              className="size-[16px] cursor-pointer text-neutral-500 hover:text-blue-500"
              onClick={showInput}
            >
              <ClipboardPenIcon size={16} />
            </div>
          </div>
        )}
      </div>

      {editState === 'edited' && (
        <div className="flex w-full justify-end text-xs text-green-500">
          {t('settings.about.hostnameUpdated')}
        </div>
      )}
    </div>
  );
};

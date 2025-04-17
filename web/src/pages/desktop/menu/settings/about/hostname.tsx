import { useEffect, useState } from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { useSetAtom } from 'jotai';
import { ClipboardPenIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';

export const Hostname = () => {
  const { t } = useTranslation();
  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);

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
    <>
      <div className="flex w-full items-center justify-between pt-4">
        <span>{t('settings.about.hostname')}</span>

        {editState === 'editing' ? (
          <div className="flex items-center space-x-1">
            <Input
              disabled={isLoading}
              onFocus={() => setIsKeyboardEnable(false)}
              onBlur={() => setIsKeyboardEnable(true)}
              style={{ width: 150 }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button size="small" icon={<CheckOutlined />} onClick={update} />
            <Button size="small" icon={<CloseOutlined />} onClick={() => setEditState('')} />
          </div>
        ) : (
          <div className="flex items-start space-x-2">
            <span>{hostname}</span>
            <div
              className="cursor-pointer text-blue-500 hover:text-blue-500/60"
              onClick={showInput}
            >
              <ClipboardPenIcon size={18} />
            </div>
          </div>
        )}
      </div>

      {editState === 'edited' && (
        <div className="flex w-full justify-end pt-1 text-xs text-green-500">
          {t('settings.about.hostnameUpdated')}
        </div>
      )}
    </>
  );
};

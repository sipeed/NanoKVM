import { ChangeEvent, useRef, useState } from 'react';
import { Button, Divider, Input, List, Popover } from 'antd';
import type { InputRef } from 'antd';
import clsx from 'clsx';
import { useSetAtom } from 'jotai';
import { NetworkIcon, SendIcon, Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';

import { deleteWolMac, getWolMacs, wol } from '@/api/network.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';

export const Wol = () => {
  const { t } = useTranslation();
  const isBigScreen = useMediaQuery({ minWidth: 640 });

  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const [log, setLog] = useState('');

  const [macList, setMacList] = useState<string[]>([]);

  const inputRef = useRef<InputRef>(null);

  function handleOpenChange(open: boolean) {
    if (open) {
      getMacs();

      setIsKeyboardEnable(false);
    } else {
      setInput('');
      setStatus('');
      setLog('');

      setIsKeyboardEnable(true);
    }

    setIsPopoverOpen(open);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
  }

  function getMacs() {
    getWolMacs().then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setMacList(rsp.data.macs.filter((mac: string) => mac !== ''));
    });
  }

  function deleteMac(mac: string) {
    deleteWolMac(mac).then((rsp) => {
      if (rsp.code === 0) {
        setMacList(macList.filter((item) => item !== mac));
      }
    });
  }

  function wake(mac?: string) {
    if (status === 'loading') return;

    const value = mac ? mac : input;
    if (!value) return;

    setStatus('loading');
    setLog(t('wol.sending'));

    wol(value)
      .then((rsp) => {
        if (rsp.code !== 0) {
          setStatus('failed');
          setLog(rsp.msg);
          return;
        }

        setStatus('success');
        setLog(t('wol.sent'));
      })
      .catch(() => {
        setStatus('failed');
      });
  }

  const content = (
    <div className="min-w-[300px]">
      <div className="flex items-center justify-between px-1">
        <span className="text-base font-bold text-neutral-300">{t('wol.title')}</span>
      </div>

      <Divider style={{ margin: '10px 0 10px 0' }} />

      <div className="pb-1 text-neutral-500">{t('wol.input')}</div>
      <div className="flex items-center space-x-1">
        <Input ref={inputRef} value={input} onChange={handleChange} />
        <Button type="primary" onClick={() => wake()}>
          {t('wol.ok')}
        </Button>
      </div>

      <div className={clsx('py-2')}>
        {status && (
          <div
            className={clsx(
              'max-w-[300px] break-words text-sm',
              status === 'failed' ? 'text-red-500' : 'text-green-500'
            )}
          >
            {log}
          </div>
        )}
      </div>

      <List
        itemLayout="horizontal"
        locale={{ emptyText: ' ' }}
        dataSource={macList}
        renderItem={(mac) => (
          <List.Item className="flex w-full items-center justify-between">
            <div className="h-[24px] max-w-[200px]">{mac}</div>
            <div className="flex items-center space-x-1">
              <div
                className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded text-green-500 hover:bg-neutral-700/80"
                onClick={() => wake(mac)}
              >
                <SendIcon size={16} />
              </div>
              <div
                className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded text-red-500 hover:bg-neutral-700"
                onClick={() => deleteMac(mac)}
              >
                <Trash2Icon size={16} />
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Popover
      content={content}
      placement={isBigScreen ? 'bottomLeft' : 'bottom'}
      trigger="click"
      arrow={false}
      open={isPopoverOpen}
      onOpenChange={handleOpenChange}
    >
      <div className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700 hover:text-white">
        <NetworkIcon size={16} />
      </div>
    </Popover>
  );
};

import { ChangeEvent, useRef, useState } from 'react';
import { Button, Divider, Input, List } from 'antd';
import type { InputRef } from 'antd';
import clsx from 'clsx';
import { useSetAtom } from 'jotai';
import { Eye, EyeClosed, NetworkIcon, Pencil, SendIcon, Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { deleteWolMac, getWolMacs, setWolMacName, wol } from '@/api/network.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';
import { MenuItem } from '@/components/menu-item.tsx';

interface MacItem {
  name: string;
  mac: string;
  isShow: boolean;
  isName: boolean;
  isEdit: boolean;
}

export const Wol = () => {
  const { t } = useTranslation();

  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);

  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const [log, setLog] = useState('');

  const [macList, setMacList] = useState<MacItem[]>([]);

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

      const isEdit = false;
      const macList = rsp.data.macs
      .filter((item: string) => item.trim() !== '')
      .map((item: string) => {
        const parts = item.split(" ");
        const isName = parts.length > 1;
        const name = isName ? parts[1] : '';
        const mac = parts[0];
        const isShow = !isName;
        return { name, mac, isShow, isName, isEdit};
      });

      setMacList([]);
      setMacList(macList);
    });
  }

  function toggleShow(mac: string) {
    setMacList(
      macList.map((item) =>
        item.mac === mac ? { ...item, isShow: !item.isShow } : item
      )
    );
  }

  function editMac(mac: string,isEdit: boolean) {
    setMacList(
      macList.map((item) =>
        item.mac === mac ? { ...item, isEdit: !isEdit } : item
      )
    );  
  }

  async function setMacName(e: React.KeyboardEvent<HTMLInputElement>, mac: string) {
    const value: string = e.currentTarget.value;
    const rsp = await setWolMacName(mac,value);
    if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
    }
    getMacs();
  }

  function deleteMac(mac: string) {
    deleteWolMac(mac).then((rsp) => {
      if (rsp.code === 0) {
       getMacs();
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
        getMacs();
        setInput('');
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
        <Input ref={inputRef} value={input} onChange={handleChange} onPressEnter={() => wake()}/>
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
        renderItem={(item) => (
          <List.Item className="flex w-full items-center justify-between">
            <div className="h-[24px] max-w-[200px]">
              {item.isEdit ? <Input onFocus={() => setIsKeyboardEnable(false)} onBlur={() => setIsKeyboardEnable(true)} defaultValue={item.name} onPressEnter={(e) => setMacName(e, item.mac)} />:(item.isShow ? item.mac : item.name)}
            </div>

            <div className="flex items-center space-x-1">
              {item.isName && <div
                className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded text-500 hover:bg-neutral-700/80"
                onClick={() => toggleShow(item.mac)}
              >
                {item.isShow ? <EyeClosed size={16} /> : <Eye size={16} />}
              </div>}
              <div
                className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded text-500 hover:bg-neutral-700"
                onClick={() => editMac(item.mac,item.isEdit)}
              >
                <Pencil size={16} />
              </div>
              <div
                className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded text-green-500 hover:bg-neutral-700/80"
                onClick={() => wake(item.mac)}
              >
                <SendIcon size={16} />
              </div>
              <div
                className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded text-red-500 hover:bg-neutral-700"
                onClick={() => deleteMac(item.mac)}
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
    <MenuItem
      title={t('wol.title')}
      icon={<NetworkIcon size={16} />}
      content={content}
      onOpenChange={handleOpenChange}
    />
  );
};

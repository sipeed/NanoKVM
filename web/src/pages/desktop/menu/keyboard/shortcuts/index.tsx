import { useEffect, useState } from 'react';
import { Divider, Popover } from 'antd';
import { CommandIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/hid.ts';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Recorder } from './recorder.tsx';
import { Shortcut } from './shortcut.tsx';
import type { Shortcut as ShortcutInterface } from './types.ts';

export const Shortcuts = () => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [customShortcuts, setCustomShortcuts] = useState<ShortcutInterface[]>([]);

  const defaultShortcuts: ShortcutInterface[] = [
    {
      keys: [
        { code: 'MetaLeft', label: 'Win' },
        { code: 'Tab', label: 'Tab' }
      ]
    },
    {
      keys: [
        { code: 'ControlLeft', label: 'Ctrl' },
        { code: 'AltLeft', label: 'Alt' },
        { code: 'Delete', label: '⌫' }
      ]
    }
  ];

  useEffect(() => {
    getShortcuts();
  }, [isOpen]);

  async function getShortcuts() {
    try {
      const rsp = await api.getShortcuts();
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setCustomShortcuts(rsp.data.shortcuts);
    } catch (err) {
      console.log(err);
    }
  }

  async function addShortcut(shortcut: ShortcutInterface) {
    try {
      const rsp = await api.addShortcut(shortcut.keys);
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      await getShortcuts();
    } catch (err) {
      console.log(err);
    }
  }

  async function delShortcut(shortcut: ShortcutInterface) {
    try {
      if (!shortcut.id) return;

      const rsp = await api.deleteShortcut(shortcut.id);
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      await getShortcuts();
    } catch (err) {
      console.log(err);
    }
  }

  function handleOpenChange(open: boolean) {
    if (open) {
      setIsOpen(true);
      return;
    }
    if (isRecording) {
      return;
    }
    setIsOpen(false);
  }

  const content = (
    <ScrollArea className="max-w-[400px] [&>[data-radix-scroll-area-viewport]]:max-h-[350px]">
      {/* custom shortcuts */}
      {customShortcuts.length > 0 && (
        <>
          {customShortcuts.map((shortcut) => (
            <Shortcut key={shortcut.id} shortcut={shortcut}></Shortcut>
          ))}

          <Divider style={{ margin: '5px 0 5px 0' }} />
        </>
      )}

      {/*  default shortcuts */}
      {defaultShortcuts.map((shortcut, index) => (
        <Shortcut key={index} shortcut={shortcut}></Shortcut>
      ))}

      <Divider style={{ margin: '5px 0 5px 0' }} />

      <Recorder
        shortcuts={customShortcuts}
        addShortcut={addShortcut}
        delShortcut={delShortcut}
        setIsRecording={setIsRecording}
      />
    </ScrollArea>
  );

  return (
    <Popover
      content={content}
      trigger="hover"
      placement="rightTop"
      align={{ offset: [14, 0] }}
      open={isOpen}
      onOpenChange={handleOpenChange}
      arrow={false}
    >
      <div className="flex cursor-pointer select-none items-center space-x-2 rounded py-1 pl-2 pr-5 hover:bg-neutral-700/70">
        <CommandIcon size={18} />
        <span>{t('keyboard.shortcut.title')}</span>
      </div>
    </Popover>
  );
};

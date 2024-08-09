import { useEffect, useState } from 'react';
import { Divider, Popover } from 'antd';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import {
  CheckIcon,
  EyeOffIcon,
  HandIcon,
  MouseIcon,
  MousePointerIcon,
  PlusIcon,
  RefreshCwIcon,
  SquareMousePointerIcon,
  TextCursorIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/storage';
import * as ls from '@/lib/localstorage';
import { client } from '@/lib/websocket';
import { mouseModeAtom, mouseStyleAtom } from '@/jotai/mouse';

export const Mouse = () => {
  const { t } = useTranslation();
  const [mouseStyle, setMouseStyle] = useAtom(mouseStyleAtom);
  const [mouseMode, setMouseMode] = useAtom(mouseModeAtom);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const mouseStyles = [
    { name: t('cursor.default'), icon: <MousePointerIcon size={14} />, value: 'cursor-default' },
    { name: t('cursor.grab'), icon: <HandIcon size={14} />, value: 'cursor-grab' },
    { name: t('cursor.cell'), icon: <PlusIcon size={14} />, value: 'cursor-cell' },
    { name: t('cursor.text'), icon: <TextCursorIcon size={14} />, value: 'cursor-text' },
    { name: t('cursor.hide'), icon: <EyeOffIcon size={14} />, value: 'cursor-none' }
  ];

  const mouseModes = [
    { name: t('cursor.absolute'), value: 'absolute' },
    { name: t('cursor.relative'), value: 'relative' }
  ];

  useEffect(() => {
    const style = ls.getMouseStyle();
    if (style && style !== mouseStyle) {
      setMouseStyle(style);
    }

    const mode = ls.getMouseMode();
    if (mode && mode !== mouseMode) {
      setMouseMode(mode);
    }
  }, []);

  function updateStyle(style: string) {
    setMouseStyle(style);
    ls.setMouseStyle(style);
  }

  function updateMode(mode: string) {
    setMouseMode(mode);
    ls.setMouseMode(mode);

    if (mode === 'relative') {
      client.close();
      setTimeout(() => {
        client.connect();
      }, 500);
    }
  }

  function resetHid() {
    setIsPopoverOpen(false);

    client.close();

    api.resetHid().finally(() => {
      client.connect();
    });
  }

  const content = (
    <>
      {mouseStyles.map((style) => (
        <div
          key={style.value}
          className={clsx(
            'flex cursor-pointer select-none items-center space-x-1 rounded px-3 py-1.5 hover:bg-neutral-600',
            style.value === mouseStyle ? 'text-green-500' : 'text-white'
          )}
          onClick={() => updateStyle(style.value)}
        >
          <div className="flex h-[14px] w-[20px] items-end">{style.icon}</div>
          <span>{style.name}</span>
        </div>
      ))}

      <Divider style={{ margin: '10px 0' }} />

      <Popover
        content={
          <>
            {mouseModes.map((mode) => (
              <div
                key={mode.value}
                className="my-1 flex cursor-pointer items-center space-x-1 rounded py-1 pl-2 pr-5 hover:bg-neutral-700"
                onClick={() => updateMode(mode.value)}
              >
                <div className="flex h-[16px] w-[16px] items-end text-blue-500">
                  {mode.value === mouseMode && <CheckIcon strokeWidth={3} size={16} />}
                </div>
                <span>{mode.name}</span>
              </div>
            ))}
          </>
        }
        placement="rightTop"
        arrow={true}
        trigger="hover"
      >
        <div className="flex h-[30px] cursor-pointer items-center space-x-1 rounded px-3 text-neutral-300 hover:bg-neutral-700">
          <div className="flex h-[14px] w-[20px] items-end">
            <SquareMousePointerIcon size={14} />
          </div>
          <span>{t('cursor.mode')}</span>
        </div>
      </Popover>

      <div
        className="flex cursor-pointer select-none items-center space-x-1 rounded px-3 py-1.5 hover:bg-neutral-600"
        onClick={resetHid}
      >
        <div className="flex h-[14px] w-[20px] items-end">
          <RefreshCwIcon size={14} />
        </div>
        <span>{t('cursor.resetHid')}</span>
      </div>
    </>
  );

  return (
    <Popover
      content={content}
      placement="bottomLeft"
      trigger="click"
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      <div className="flex h-[30px] cursor-pointer items-center rounded px-2 text-neutral-300 hover:bg-neutral-700">
        <MouseIcon size={18} />
      </div>
    </Popover>
  );
};

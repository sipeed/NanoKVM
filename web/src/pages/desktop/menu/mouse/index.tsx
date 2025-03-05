import { useEffect, useState } from 'react';
import { Divider, Popover, Tooltip } from 'antd';
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

import * as api from '@/api/hid';
import * as ls from '@/lib/localstorage';
import { client } from '@/lib/websocket';
import { mouseModeAtom, mouseStyleAtom } from '@/jotai/mouse';

export const Mouse = () => {
  const { t } = useTranslation();
  const [mouseStyle, setMouseStyle] = useAtom(mouseStyleAtom);
  const [mouseMode, setMouseMode] = useAtom(mouseModeAtom);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const tooltip = t('mouse.title');
  const [tooltipValue, setTooltipValue] = useState(tooltip);

  const mouseStyles = [
    { name: t('mouse.default'), icon: <MousePointerIcon size={14} />, value: 'cursor-default' },
    { name: t('mouse.grab'), icon: <HandIcon size={14} />, value: 'cursor-grab' },
    { name: t('mouse.cell'), icon: <PlusIcon size={14} />, value: 'cursor-cell' },
    { name: t('mouse.text'), icon: <TextCursorIcon size={14} />, value: 'cursor-text' },
    { name: t('mouse.hide'), icon: <EyeOffIcon size={14} />, value: 'cursor-none' }
  ];

  const mouseModes = [
    { name: t('mouse.absolute'), value: 'absolute' },
    { name: t('mouse.relative'), value: 'relative' }
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
    if (isResetting) return;
    setIsResetting(true);

    client.close();

    api.reset().finally(() => {
      client.connect();
      setIsResetting(false);
      setIsPopoverOpen(false);
    });
  }

  const content = (
    <>
      {/* mouse cursor */}
      {mouseStyles.map((style) => (
        <div
          key={style.value}
          className={clsx(
            'flex cursor-pointer select-none items-center space-x-1 rounded py-1.5 pl-3 pr-6 hover:bg-neutral-700/70',
            style.value === mouseStyle && 'text-green-500'
          )}
          onClick={() => updateStyle(style.value)}
        >
          <div className="flex h-[14px] w-[20px] items-end">{style.icon}</div>
          <span>{style.name}</span>
        </div>
      ))}

      <Divider style={{ margin: '10px 0' }} />

      {/* mouse mode */}
      <Popover
        content={
          <>
            {mouseModes.map((mode) => (
              <div
                key={mode.value}
                className="flex cursor-pointer items-center space-x-1 rounded py-1.5 pl-2 pr-5 hover:bg-neutral-700/70"
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
        <div className="flex h-[30px] cursor-pointer items-center space-x-1 rounded pl-3 pr-5 text-neutral-300 hover:bg-neutral-700/70">
          <div className="flex h-[14px] w-[20px] items-end">
            <SquareMousePointerIcon size={14} />
          </div>
          <span>{t('mouse.mode')}</span>
        </div>
      </Popover>

      {/* reset HID */}
      <div
        className="flex cursor-pointer select-none items-center space-x-1 rounded px-3 py-1 hover:bg-neutral-700/70"
        onClick={resetHid}
      >
        <div className="flex h-[14px] w-[20px] items-end">
          <RefreshCwIcon
            className={clsx({ 'animate-spin text-blue-500': isResetting })}
            size={14}
          />
        </div>
        <span>{t('mouse.resetHid')}</span>
      </div>
    </>
  );

  return (
    <Popover
      content={content}
      placement="bottomLeft"
      trigger="click"
      arrow={false}
      open={isPopoverOpen}
      onOpenChange={(visible) => {
        setIsPopoverOpen(visible);
        setTooltipValue(visible ? "" : tooltip);
      }}
    >
      <Tooltip title={tooltipValue}>
        <div className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700 hover:text-white">
          <MouseIcon size={18} />
        </div>
      </Tooltip>
    </Popover>
  );
};

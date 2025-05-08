import { Popover } from 'antd';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { EyeOffIcon, HandIcon, MousePointerIcon, PlusIcon, TextCursorIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as ls from '@/lib/localstorage.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';

export const Cursor = () => {
  const { t } = useTranslation();

  const [mouseStyle, setMouseStyle] = useAtom(mouseStyleAtom);

  const mouseStyles = [
    { name: t('mouse.default'), icon: <MousePointerIcon size={14} />, value: 'cursor-default' },
    { name: t('mouse.grab'), icon: <HandIcon size={14} />, value: 'cursor-grab' },
    { name: t('mouse.cell'), icon: <PlusIcon size={14} />, value: 'cursor-cell' },
    { name: t('mouse.text'), icon: <TextCursorIcon size={14} />, value: 'cursor-text' },
    { name: t('mouse.hide'), icon: <EyeOffIcon size={14} />, value: 'cursor-none' }
  ];

  function updateMouseStyle(style: string) {
    setMouseStyle(style);
    ls.setMouseStyle(style);
  }

  const content = (
    <>
      {mouseStyles.map((style) => (
        <div
          key={style.value}
          className={clsx(
            'flex cursor-pointer select-none items-center space-x-1 rounded py-1.5 pl-3 pr-6 hover:bg-neutral-700/70',
            style.value === mouseStyle && 'text-green-500'
          )}
          onClick={() => updateMouseStyle(style.value)}
        >
          <div className="flex h-[14px] w-[20px] items-end">{style.icon}</div>
          <span>{style.name}</span>
        </div>
      ))}
    </>
  );

  return (
    <Popover content={content} placement="rightTop" arrow={false} align={{ offset: [14, 0] }}>
      <div className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700/70">
        <MousePointerIcon size={18} />
        <span>{t('mouse.cursor')}</span>
      </div>
    </Popover>
  );
};

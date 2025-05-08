import { Popover } from 'antd';
import { useAtom } from 'jotai';
import { CheckIcon, SquareDashedMousePointerIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as ls from '@/lib/localstorage.ts';
import { client } from '@/lib/websocket.ts';
import { mouseModeAtom } from '@/jotai/mouse.ts';

export const MouseMode = () => {
  const { t } = useTranslation();

  const [mouseMode, setMouseMode] = useAtom(mouseModeAtom);

  const mouseModes = [
    { name: t('mouse.absolute'), value: 'absolute' },
    { name: t('mouse.relative'), value: 'relative' }
  ];

  function updateMouseMode(mode: string) {
    setMouseMode(mode);
    ls.setMouseMode(mode);

    if (mode === 'relative') {
      client.close();
      setTimeout(() => {
        client.connect();
      }, 500);
    }
  }

  const content = (
    <>
      {mouseModes.map((mode) => (
        <div
          key={mode.value}
          className="flex cursor-pointer items-center space-x-1 rounded py-1.5 pl-2 pr-5 hover:bg-neutral-700/70"
          onClick={() => updateMouseMode(mode.value)}
        >
          <div className="flex h-[16px] w-[16px] items-end text-blue-500">
            {mode.value === mouseMode && <CheckIcon strokeWidth={3} size={16} />}
          </div>
          <span>{mode.name}</span>
        </div>
      ))}
    </>
  );

  return (
    <Popover content={content} placement="rightTop" arrow={false} align={{ offset: [14, 0] }}>
      <div className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700/70">
        <SquareDashedMousePointerIcon size={18} />
        <span>{t('mouse.mode')}</span>
      </div>
    </Popover>
  );
};

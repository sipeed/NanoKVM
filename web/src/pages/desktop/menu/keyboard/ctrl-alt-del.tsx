import clsx from 'clsx';
import { OctagonMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getKeycode, getModifierBit } from '@/lib/keymap.ts';
import { client, MessageEvent } from '@/lib/websocket.ts';

export const CtrlAltDel = () => {
  const { t } = useTranslation();

  function sendCtrlAltDel() {
    const ctrl = getModifierBit('ControlLeft')!;
    const alt = getModifierBit('AltLeft')!;
    const modifier = ctrl | alt;

    const del = getKeycode('Delete')!;

    send(modifier, del);
    send(0, 0);
  }

  function send(modifier: number, code: number) {
    const data = new Uint8Array([MessageEvent.Keyboard, modifier, 0, code, 0, 0, 0, 0, 0]);
    client.send(data);
  }

  return (
    <div
      className={clsx(
        'flex cursor-pointer select-none items-center space-x-2 rounded py-1 pl-2 pr-5 hover:bg-neutral-700/70'
      )}
      onClick={sendCtrlAltDel}
    >
      <OctagonMinus size={18} />
      <span>{t('keyboard.ctrlaltdel')}</span>
    </div>
  );
};

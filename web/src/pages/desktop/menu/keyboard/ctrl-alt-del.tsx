import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { OctagonMinus } from 'lucide-react';

import { KeyboardCodes, ModifierCodes } from '@/pages/desktop/keyboard/mappings.ts';
import { client } from '@/lib/websocket.ts';

export const CtrlAltDel = () => {
  const { t } = useTranslation();

  function sendCtrlAltDel() {
    const ctrl = ModifierCodes.get('ControlLeft')!;
    const alt = ModifierCodes.get('AltLeft')!;
    const del = KeyboardCodes.get('Delete')!;

    client.send([1, del, ctrl, 0, alt, 0]);
    client.send([1, 0, 0, 0, 0, 0]);
  };

  return (
    <div
      className={clsx(
        "flex cursor-pointer select-none items-center space-x-2 rounded py-1 pl-2 pr-5 hover:bg-neutral-700/70"
      )}
      onClick={sendCtrlAltDel}
    >
      <OctagonMinus size={18} />
      <span>{t('keyboard.ctrlaltdel')}</span>
    </div>
  );
}

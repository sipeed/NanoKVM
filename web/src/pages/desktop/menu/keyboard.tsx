import { useSetAtom } from 'jotai';
import { KeyboardIcon } from 'lucide-react';

import { isKeyboardOpenAtom } from '@/jotai/keyboard.ts';

export const Keyboard = () => {
  const setIsKeyboardOpen = useSetAtom(isKeyboardOpenAtom);

  return (
    <>
      <div
        className="flex h-[30px] cursor-pointer items-center justify-center rounded px-2 text-neutral-300 hover:bg-neutral-700"
        onClick={() => setIsKeyboardOpen((o) => !o)}
      >
        <KeyboardIcon size={18} />
      </div>
    </>
  );
};

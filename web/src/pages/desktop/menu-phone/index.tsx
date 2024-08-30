import { useState } from 'react';
import clsx from 'clsx';
import { MenuIcon } from 'lucide-react';

import { Image } from './image';
import { Keyboard } from './keyboard.tsx';
import { Mouse } from './mouse.tsx';
import { Power } from './power.tsx';
import { Screen } from './screen';
import { Script } from './script';
import { Settings } from './settings';
import { Terminal } from './terminal';
import { Wol } from './wol.tsx';

export const MenuPhone = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="fixed left-[10px] top-[10px] z-[1000]">
      <div className="sticky top-[10px]">
        {!isMenuOpen && (
          <div
            className="flex h-[32px] items-center justify-center rounded bg-neutral-800/80 px-2 text-white"
            onClick={() => setIsMenuOpen((o) => !o)}
          >
            <MenuIcon size={18} />
          </div>
        )}

        <div className={clsx('flex-col rounded bg-neutral-800/90', isMenuOpen ? 'flex' : 'hidden')}>
          <div
            className="flex h-[32px] rotate-90 items-center justify-center text-white"
            onClick={() => setIsMenuOpen((o) => !o)}
          >
            <MenuIcon size={18} />
          </div>

          <Settings />
          <Screen />
          <Keyboard />
          <Mouse />
          <Image />
          <Script />
          <Terminal />
          <Wol />
          <Power />
        </div>
      </div>
    </div>
  );
};

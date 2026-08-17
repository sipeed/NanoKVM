import { useAtom, useAtomValue } from 'jotai';
import { CheckIcon, MousePointer2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  normalizeInputAdapterMode,
  resolveInputAdapter,
  type InputAdapterMode
} from '@/lib/input-adapter.ts';
import * as ls from '@/lib/localstorage.ts';
import { inputAdapterAtom, mouseModeAtom } from '@/jotai/mouse.ts';
import { MenuSubmenu } from '@/components/menu-item.tsx';

const adapterModes: InputAdapterMode[] = ['auto', 'pointer-lock', 'touchpad'];

export const InputAdapter = () => {
  const { t } = useTranslation();
  const [inputAdapter, setInputAdapter] = useAtom(inputAdapterAtom);
  const mouseMode = useAtomValue(mouseModeAtom);
  const effectiveAdapter = resolveInputAdapter(
    inputAdapter,
    mouseMode === 'relative' ? 'relative' : 'absolute'
  );

  function updateInputAdapter(mode: InputAdapterMode) {
    setInputAdapter(mode);
    ls.setInputAdapter(mode);
  }

  const content = (
    <>
      {adapterModes.map((mode) => {
        const normalizedMode = normalizeInputAdapterMode(mode);
        const selected = inputAdapter === normalizedMode;
        const label = t(`mouse.inputAdapter.${normalizedMode}`);
        const suffix =
          normalizedMode === 'auto' ? ` (${t(`mouse.inputAdapter.${effectiveAdapter}`)})` : '';

        return (
          <div
            key={normalizedMode}
            className="flex cursor-pointer items-center space-x-1 rounded py-1.5 pl-2 pr-5 hover:bg-neutral-700/70"
            onClick={() => updateInputAdapter(normalizedMode)}
          >
            <div className="flex h-[16px] w-[16px] items-end text-blue-500">
              {selected && <CheckIcon strokeWidth={3} size={16} />}
            </div>
            <span>
              {label}
              {suffix}
            </span>
          </div>
        );
      })}
    </>
  );

  return (
    <MenuSubmenu
      title={t('mouse.inputAdapter.title')}
      content={content}
      popoverProps={{ placement: 'rightTop', arrow: false, align: { offset: [14, 0] } }}
    >
      <div className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700/70">
        <MousePointer2Icon size={18} />
        <span>{t('mouse.inputAdapter.title')}</span>
      </div>
    </MenuSubmenu>
  );
};

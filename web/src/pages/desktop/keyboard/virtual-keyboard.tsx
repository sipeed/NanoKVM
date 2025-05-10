import { useEffect, useRef, useState } from 'react';
import { XIcon } from 'lucide-react';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import Keyboard, { KeyboardButtonTheme } from 'react-simple-keyboard';
import { Drawer } from 'vaul';

import 'react-simple-keyboard/build/css/index.css';
import '@/assets/styles/keyboard.css';

import { useMediaQuery } from 'react-responsive';

import { getKeyboardLayout } from '@/lib/localstorage.ts';
import { client } from '@/lib/websocket.ts';
import { isKeyboardOpenAtom } from '@/jotai/keyboard.ts';

import { KeyboardCodes, ModifierCodes } from './mappings.ts';
import {
  doubleKeys,
  keyboardArrowsOptions,
  keyboardControlPadOptions,
  keyboardOptions,
  modifierKeys,
  specialKeyMap
} from './virtual-keys.ts';

// Helper function to map keys per active layout
function getKeyCode(key: string, layout: string) {
  // AZERTY: map < > key (next to left-shift) to OEM_102 usage (100)
  if (layout === 'azerty' && key === 'Backquote_azerty') {
    return KeyboardCodes.get('Backquote_azerty');
  }

  // AZERTY: swap A↔Q and Z↔W on French physical positions
  if (layout === 'azerty' && key.endsWith('_azerty')) {
    const base = key.replace('_azerty', '');
    if (base === 'KeyA')   return KeyboardCodes.get('KeyQ');
    if (base === 'KeyQ')   return KeyboardCodes.get('KeyA');
    if (base === 'KeyZ')   return KeyboardCodes.get('KeyW');
    if (base === 'KeyW')   return KeyboardCodes.get('KeyZ');
    // all other labels use their own code
    return KeyboardCodes.get(base);
  }

  // default (QWERTY / Mac / Rus)
  return KeyboardCodes.get(key);
}

export const VirtualKeyboard = () => {
  const isBigScreen = useMediaQuery({ minWidth: 850 });
  const [isKeyboardOpen, setIsKeyboardOpen] = useAtom(isKeyboardOpenAtom);
  const [layout, setLayout] = useState(getKeyboardLayout() || 'default');
  const [activeModifierKeys, setActiveModifierKeys] = useState<string[]>([]);
  const keyboardRef = useRef<any>(null);

  // Update the layout when it changes in settings
  useEffect(() => {
    // Function to check if the layout has changed
    const checkLayout = () => {
      const currentLayout = getKeyboardLayout() || 'default';
      if (currentLayout !== layout) {
        setLayout(currentLayout);
      }
    };

    // Check for layout changes every time the keyboard is opened
    if (isKeyboardOpen) {
      checkLayout();
    }
  }, [isKeyboardOpen, layout]);

  function onKeyPress(key: string) {
    if (modifierKeys.includes(key)) {
      if (activeModifierKeys.includes(key)) {
        sendModifierKeyDown();
        sendModifierKeyUp();
      } else {
        setActiveModifierKeys([...activeModifierKeys, key]);
      }
      return;
    }

    sendKeydown(key);
  }

  function onKeyReleased(key: string) {
    if (modifierKeys.includes(key)) {
      return;
    }

    sendKeyup();
  }

  function sendKeydown(key: string) {
    const specialKey = specialKeyMap.get(key);
    const code = getKeyCode(specialKey ? specialKey : key, layout);

    if (!code) {
      console.log('unknown code: ', key);
      return;
    }

    const modifiers = sendModifierKeyDown();

    client.send([1, code, ...modifiers]);
  }

  function sendKeyup() {
    sendModifierKeyUp();
    client.send([1, 0, 0, 0, 0, 0]);
  }

  function sendModifierKeyDown() {
    let ctrl = 0;
    let shift = 0;
    let alt = 0;
    let meta = 0;

    activeModifierKeys.forEach((modifierKey) => {
      const key = specialKeyMap.get(modifierKey)!;

      const code = KeyboardCodes.get(key)!;
      const modifier = ModifierCodes.get(key)!;

      if ([1, 16].includes(modifier)) {
        ctrl = modifier;
      } else if ([2, 32].includes(modifier)) {
        shift = modifier;
      } else if ([4, 64].includes(modifier)) {
        alt = modifier;
      } else if ([8, 128].includes(modifier)) {
        meta = modifier;
      }

      client.send([1, code, ctrl, shift, alt, meta]);
    });

    return [ctrl, shift, alt, meta];
  }

  function sendModifierKeyUp() {
    if (activeModifierKeys.length === 0) return;

    activeModifierKeys.forEach(() => {
      client.send([1, 0, 0, 0, 0, 0]);
    });

    setActiveModifierKeys([]);
  }

  function getButtonTheme(): KeyboardButtonTheme[] {
    const theme = [{ class: 'hg-double', buttons: doubleKeys.join(' ') }];

    if (activeModifierKeys.length > 0) {
      const buttons = activeModifierKeys.join(' ');
      theme.push({ class: 'hg-highlight', buttons });
    }

    return theme;
  }

  return (
    <Drawer.Root open={isKeyboardOpen} onOpenChange={setIsKeyboardOpen} modal={false}>
      <Drawer.Portal>
        <Drawer.Content
          className={clsx(
            'fixed bottom-0 left-0 right-0 z-[999] mx-auto overflow-hidden rounded bg-white outline-none',
            isBigScreen ? 'w-[820px]' : 'w-[650px]'
          )}
        >
          {/* header */}
          <div className="flex items-center justify-between px-3 py-1">
            <div className="keyboard-header text-sm font-medium px-2">
              {layout === 'default'
                ? 'QWERTY (Win)'
                : layout === 'mac'
                ? 'QWERTY (Mac)'
                : layout === 'azerty'
                ? 'AZERTY (Win)'
                : 'Russian'}
            </div>

            <div className="flex w-[100px] items-center justify-end">
              <div
                className="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded text-neutral-600 hover:bg-neutral-300 hover:text-white"
                onClick={() => setIsKeyboardOpen(false)}
              >
                <XIcon size={18} />
              </div>
            </div>
          </div>

          <div className="h-px flex-shrink-0 border-b bg-neutral-300" />

          <div data-vaul-no-drag className="keyboardContainer w-full">
            {/* main keyboard */}
            <Keyboard
              buttonTheme={getButtonTheme()}
              keyboardRef={(r) => (keyboardRef.current = r)}
              onKeyPress={onKeyPress}
              onKeyReleased={onKeyReleased}
              layoutName={layout}
              {...keyboardOptions}
            />

            {/* control keyboard */}
            {isBigScreen && (
              <div className="controlArrows">
                <Keyboard
                  onKeyPress={onKeyPress}
                  onKeyReleased={onKeyReleased}
                  {...keyboardControlPadOptions}
                />

                <Keyboard
                  onKeyPress={onKeyPress}
                  onKeyReleased={onKeyReleased}
                  {...keyboardArrowsOptions}
                />
              </div>
            )}
          </div>
        </Drawer.Content>
        <Drawer.Overlay />
      </Drawer.Portal>
    </Drawer.Root>
  );
};

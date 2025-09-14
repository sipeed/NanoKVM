import { useEffect, useRef, useState } from 'react';
import { AppleOutlined, WindowsOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { XIcon } from 'lucide-react';
import Keyboard, { KeyboardButtonTheme } from 'react-simple-keyboard';
import { Drawer } from 'vaul';

import 'react-simple-keyboard/build/css/index.css';
import '@/assets/styles/keyboard.css';

import { ConfigProvider, Segmented, Select, theme } from 'antd';
import { useMediaQuery } from 'react-responsive';

import * as storage from '@/lib/localstorage.ts';
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

export const VirtualKeyboard = () => {
  const isBigScreen = useMediaQuery({ minWidth: 850 });

  const [isKeyboardOpen, setIsKeyboardOpen] = useAtom(isKeyboardOpenAtom);

  const [keyboardLayout, setKeyboardLayout] = useState('default');
  const [keyboardSystem, setKeyboardSystem] = useState('win');
  const [keyboardLanguage, setKeyboardLanguage] = useState('en');
  const [activeModifierKeys, setActiveModifierKeys] = useState<string[]>([]);

  const keyboardRef = useRef<any>(null);

  const systems = [
    { value: 'win', icon: <WindowsOutlined /> },
    { value: 'mac', icon: <AppleOutlined /> }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'Deutsch' },
    { value: 'ru', label: 'Russian' }
  ];

  useEffect(() => {
    const system = storage.getKeyboardSystem();
    if (system && ['win', 'mac'].includes(system)) {
      setKeyboardSystem(system);
    }

    const language = storage.getKeyboardLanguage();
    if (language && languages.some((lng) => lng.value === language)) {
      setKeyboardLanguage(language);
    }
  }, []);

  useEffect(() => {
    const layoutMap = new Map([
      ['en', 'default'],
      ['ru', 'rus'],
      ['de', 'qwertz'],
      ['fr', 'azerty']
    ]);

    if (keyboardLanguage === 'en' && keyboardSystem === 'mac') {
      setKeyboardLayout('mac');
      return;
    }

    if (layoutMap.has(keyboardLanguage)) {
      setKeyboardLayout(layoutMap.get(keyboardLanguage)!);
      return;
    }

    setKeyboardLayout('default');
  }, [keyboardSystem, keyboardLanguage]);

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
    const code = getKeyCode(key);
    if (!code) {
      console.log('unknown code: ', key);
      return;
    }

    const modifiers = sendModifierKeyDown();

    client.send([1, code, ...modifiers]);
  }

  function getKeyCode(key: string) {
    console.log('Key: ', key);
    console.log('KeyboardLanguage: ', keyboardLanguage);
    
    // AZERTY: swap A↔Q and Z↔W on French physical positions
    if (keyboardLanguage === 'fr' && key.endsWith('_azerty')) {
      const base = key.replace('_azerty', '');
      if (base === 'KeyA') return KeyboardCodes.get('KeyQ');
      if (base === 'KeyQ') return KeyboardCodes.get('KeyA');
      if (base === 'KeyZ') return KeyboardCodes.get('KeyW');
      if (base === 'KeyW') return KeyboardCodes.get('KeyZ');
      // all other labels use their own code
      return KeyboardCodes.get(base);
    }
    if (keyboardLanguage === 'de' && key.endsWith('_qwertz')) {
      const base = key.replace('_qwertz', '');
      // Tausch
      if (base === 'KeyZ') return KeyboardCodes.get('KeyY');
      if (base === 'KeyY') return KeyboardCodes.get('KeyZ');
      
      // all other labels use their own code
      return KeyboardCodes.get(base);
    }

    const specialKey = specialKeyMap.get(key);
    if (specialKey) {
      return KeyboardCodes.get(specialKey);
    }

    return KeyboardCodes.get(key);
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

  function selectSystem(system: string) {
    setKeyboardSystem(system);
    storage.setKeyboardSystem(system);
  }

  function selectLanguage(language: string) {
    setKeyboardLanguage(language);
    storage.setKeyboardLanguage(language);
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
            <ConfigProvider
              theme={{
                algorithm: theme.defaultAlgorithm
              }}
            >
              <div className="flex items-center space-x-5">
                <Select
                  size="small"
                  style={{ minWidth: 90 }}
                  defaultValue={keyboardLanguage}
                  options={languages}
                  onChange={selectLanguage}
                />

                {keyboardLanguage === 'en' && (
                  <Segmented
                    size="small"
                    options={systems}
                    value={keyboardSystem}
                    onChange={selectSystem}
                  />
                )}
              </div>
            </ConfigProvider>

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
              layoutName={keyboardLayout}
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

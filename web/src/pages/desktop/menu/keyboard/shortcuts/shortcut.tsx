import { useState } from 'react';

import { KeyboardReport } from '@/lib/keyboard.ts';
import { client, MessageEvent } from '@/lib/websocket.ts';
import { Kbd, KbdGroup } from '@/components/ui/kbd.tsx';

import type { Shortcut as ShortcutInterface } from './types.ts';

type ShortcutProps = {
  shortcut: ShortcutInterface;
};

export const Shortcut = ({ shortcut }: ShortcutProps) => {
  const [isLoading, setIsLoading] = useState(false);

  async function sendShortcut() {
    const keyboard = new KeyboardReport();

    shortcut.keys.forEach((key) => {
      const report = keyboard.keyDown(key.code);
      send(report);
    });

    const report = keyboard.reset();
    send(report);
  }

  function send(report: Uint8Array) {
    const data = new Uint8Array([MessageEvent.Keyboard, ...report]);
    client.send(data);
  }

  async function handleClick(): Promise<void> {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await sendShortcut();
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="flex h-[32px] w-full cursor-pointer items-center space-x-1 rounded px-3 hover:bg-neutral-700/30"
      onClick={handleClick}
    >
      {shortcut.keys.map((key, index) => (
        <KbdGroup key={index}>
          <Kbd>{key.label}</Kbd>
        </KbdGroup>
      ))}
    </div>
  );
};

import { useEffect, useRef, useState } from 'react';
import { Button, Input } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { useSetAtom } from 'jotai';
import { PlusIcon, SendIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { keyboardLockAtom } from '@/jotai/keyboard.ts';
import type { PicoclawTransportState } from '@/jotai/picoclaw.ts';

import { PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE } from './keyboard-lock.ts';

type MessageInputProps = {
  transportState: PicoclawTransportState;
  disabled?: boolean;
  onSend: (content: string) => boolean | void | Promise<boolean | void>;
  onNewConversation: () => void | Promise<void>;
  disableNewConversation?: boolean;
};

export const MessageInput = ({
  transportState,
  disabled,
  onSend,
  onNewConversation,
  disableNewConversation
}: MessageInputProps) => {
  const { t } = useTranslation();
  const setKeyboardLock = useSetAtom(keyboardLockAtom);

  const [value, setValue] = useState('');
  const textareaRef = useRef<TextAreaRef | null>(null);
  const isComposingRef = useRef(false);

  const isConnecting = transportState === 'connecting';
  const canSubmit = !disabled && !isConnecting;

  useEffect(() => {
    return () => {
      setKeyboardLock({ source: PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE, locked: false });
    };
  }, [setKeyboardLock]);

  useEffect(() => {
    if (!isConnecting) {
      return;
    }

    textareaRef.current?.blur();
    setKeyboardLock({ source: PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE, locked: false });
  }, [isConnecting, setKeyboardLock]);

  async function submit() {
    const content = value.trim();
    if (!content || !canSubmit) return;
    const sent = await onSend(content);
    if (sent !== false) {
      setValue('');
    }
  }

  return (
    <div className="relative">
      <Input.TextArea
        ref={textareaRef}
        rows={3}
        value={value}
        disabled={disabled || isConnecting}
        placeholder={isConnecting ? '...' : t('picoclaw.inputPlaceholder')}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() =>
          setKeyboardLock({ source: PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE, locked: true })
        }
        onBlur={() =>
          setKeyboardLock({ source: PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE, locked: false })
        }
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
        }}
        onKeyDown={(e) => {
          const nativeEvent = e.nativeEvent as KeyboardEvent & {
            isComposing?: boolean;
            keyCode?: number;
          };
          if (isComposingRef.current || nativeEvent.isComposing || nativeEvent.keyCode === 229) {
            return;
          }
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
        // antd's own input styling loses to the chat composer's shape, so the
        // utilities that carry it are marked important instead of restyled.
        className="!resize-none !rounded-2xl !border-white/[0.08] !bg-white/[0.04] !px-4 !py-3 !pr-12 !text-sm !text-neutral-100 !shadow-none transition-colors placeholder:!text-neutral-600 focus:!border-white/[0.15] focus:!bg-white/[0.06] focus:!shadow-none disabled:!opacity-40"
      />
      <Button
        type="text"
        icon={<PlusIcon size={14} />}
        onClick={() => void onNewConversation()}
        disabled={disabled || disableNewConversation}
        className="absolute bottom-2.5 right-11 !flex !h-7 !w-7 !items-center !justify-center !rounded-lg !border !border-white/[0.08]"
        title={t('picoclaw.newConversation')}
      />
      <Button
        type="primary"
        icon={<SendIcon size={14} />}
        onClick={() => void submit()}
        disabled={!canSubmit || !value.trim()}
        className="absolute bottom-2.5 right-2.5 !flex !h-7 !w-7 !items-center !justify-center !rounded-lg"
        title={t('picoclaw.send')}
      />
    </div>
  );
};

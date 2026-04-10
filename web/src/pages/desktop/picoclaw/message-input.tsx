import { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { useSetAtom } from 'jotai';
import { PlusIcon, SendIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';
import type { PicoclawTransportState } from '@/jotai/picoclaw.ts';

type MessageInputProps = {
  transportState: PicoclawTransportState;
  onSend: (content: string) => void | Promise<void>;
  onNewConversation: () => void | Promise<void>;
  disableNewConversation?: boolean;
};

export const MessageInput = ({
  transportState,
  onSend,
  onNewConversation,
  disableNewConversation
}: MessageInputProps) => {
  const { t } = useTranslation();
  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);

  const [value, setValue] = useState('');
  const isComposingRef = useRef(false);

  const isReady = transportState === 'connected';

  useEffect(() => {
    setIsKeyboardEnable(false);
    return () => {
      setIsKeyboardEnable(true);
    };
  }, [setIsKeyboardEnable]);

  async function submit() {
    const content = value.trim();
    if (!content || !isReady) return;
    await onSend(content);
    setValue('');
  }

  return (
    <div className="relative">
      <textarea
        rows={3}
        value={value}
        disabled={!isReady}
        placeholder={isReady ? t('picoclaw.inputPlaceholder') : '...'}
        onChange={(e) => setValue(e.target.value)}
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
        className="w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 pr-12 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-white/[0.15] focus:bg-white/[0.06] disabled:opacity-40"
      />
      <Button
        type="text"
        icon={<PlusIcon size={14} />}
        onClick={() => void onNewConversation()}
        disabled={disableNewConversation}
        className="absolute bottom-2.5 right-11 !flex !h-7 !w-7 !items-center !justify-center !rounded-lg !border !border-white/[0.08]"
        title={t('picoclaw.newConversation')}
      />
      <Button
        type="primary"
        icon={<SendIcon size={14} />}
        onClick={() => void submit()}
        disabled={!isReady || !value.trim()}
        className="absolute bottom-2.5 right-2.5 !flex !h-7 !w-7 !items-center !justify-center !rounded-lg"
        title={t('picoclaw.send')}
      />
    </div>
  );
};

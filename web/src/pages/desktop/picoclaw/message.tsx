import clsx from 'clsx';
import { ImageIcon, SparklesIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PicoclawChatMessage } from '@/jotai/picoclaw.ts';

import { MarkdownContent } from './markdown-content.tsx';

type MessageProps = {
  message: PicoclawChatMessage;
};

const hiddenAssistantMessagePrefix = '🔧 `message`';

function extractDisplayText(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === 'object') {
        const record = parsed as Record<string, unknown>;
        if (typeof record.content === 'string' && record.content.trim()) {
          return record.content;
        }
        if (typeof record.text === 'string' && record.text.trim()) {
          return record.text;
        }
      }
    } catch {
      return trimmed;
    }

    return trimmed;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.content === 'string' && record.content.trim()) {
      return record.content;
    }
    if (typeof record.text === 'string' && record.text.trim()) {
      return record.text;
    }
  }

  return '';
}

export const Message = ({ message }: MessageProps) => {
  const { t } = useTranslation();

  if (message.kind === 'status') {
    return <div className="py-1 text-center text-xs text-neutral-500">{message.text}</div>;
  }

  if (message.kind === 'error') {
    if (message.text === 'unexpected EOF') {
      return null;
    }
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
        <MarkdownContent content={message.text} className="break-words text-red-200/90" />
      </div>
    );
  }

  if (message.kind === 'tool_action') {
    const toolText =
      extractDisplayText(message.text) ||
      extractDisplayText(message.action) ||
      extractDisplayText(message.raw);

    return (
      <div className="border-white/8 rounded-xl border bg-white/[0.03] px-3 py-2 text-xs text-neutral-300">
        <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-neutral-500">
          <SparklesIcon size={14} />
          <span>{t('picoclaw.message.toolAction')}</span>
        </div>
        <MarkdownContent content={toolText} className="break-words" />
      </div>
    );
  }

  if (message.kind === 'observation') {
    return (
      <div className="rounded-lg border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sm text-sky-50">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-sky-200">
          <ImageIcon size={14} />
          <span>{t('picoclaw.message.observation')}</span>
        </div>
        {message.text && <MarkdownContent content={message.text} className="mb-2 break-words" />}
        {message.imageBase64 && (
          <img
            alt={t('picoclaw.message.screenshot')}
            className="max-h-44 w-full rounded-md object-cover"
            src={`data:image/jpeg;base64,${message.imageBase64}`}
          />
        )}
      </div>
    );
  }

  if (message.text?.startsWith(hiddenAssistantMessagePrefix)) {
    return null;
  }

  const isUser = message.kind === 'user';

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm',
          isUser ? 'bg-sky-500 text-white' : 'bg-neutral-800 text-neutral-100'
        )}
      >
        <MarkdownContent content={message.text} className="break-words" />
      </div>
    </div>
  );
};

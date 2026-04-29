import { useMemo, useState } from 'react';
import { Button, Modal } from 'antd';
import { Clock3Icon, MessageSquareTextIcon, Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PicoclawSessionListItem } from '@/types';

type SidebarHistoryProps = {
  sessions: PicoclawSessionListItem[];
  activeSessionId?: string;
  isLoading: boolean;
  isDeleting: boolean;
  isSwitching?: boolean;
  onSelect: (sessionId: string) => void | Promise<void>;
  onDelete: (sessionId: string) => void | Promise<void>;
};

function formatSessionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export const SidebarHistory = ({
  sessions,
  activeSessionId,
  isLoading,
  isDeleting,
  isSwitching,
  onSelect,
  onDelete
}: SidebarHistoryProps) => {
  const { t } = useTranslation();
  const [pendingDelete, setPendingDelete] = useState<PicoclawSessionListItem | null>(null);

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center px-6 text-sm text-neutral-500">
          {t('picoclaw.history.loading')}
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <Clock3Icon size={18} className="text-neutral-600" />
          <span className="text-sm text-neutral-400">{t('picoclaw.history.emptyTitle')}</span>
          <span className="text-xs text-neutral-600">{t('picoclaw.history.emptyDescription')}</span>
        </div>
      );
    }

    return (
      <div className="picoclaw-sidebar-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
        <div className="space-y-2">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                role="button"
                tabIndex={isSwitching ? -1 : 0}
                onClick={() => {
                  if (isSwitching) {
                    return;
                  }
                  void onSelect(session.id);
                }}
                onKeyDown={(event) => {
                  if (isSwitching) {
                    return;
                  }
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    void onSelect(session.id);
                  }
                }}
                className={[
                  'group flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors',
                  isSwitching ? 'pointer-events-none opacity-60' : '',
                  isActive
                    ? 'border-sky-400/30 bg-sky-400/10'
                    : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.05]'
                ].join(' ')}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-neutral-400">
                  <MessageSquareTextIcon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-200">
                        {session.title}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                        {session.preview}
                      </div>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      danger
                      disabled={isDeleting || isSwitching}
                      icon={<Trash2Icon size={14} />}
                      className={[
                        '!mt-0.5 !hidden !items-center !justify-center !text-neutral-500 hover:!bg-red-500/10 hover:!text-red-300',
                        isActive ? '' : 'group-hover:!inline-flex'
                      ].join(' ')}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPendingDelete(session);
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-600">
                    <span>{formatSessionTime(session.updated)}</span>
                    <span>
                      {t('picoclaw.history.messageCount', { count: session.message_count })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [activeSessionId, isDeleting, isLoading, isSwitching, onSelect, sessions, t]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">{content}</div>
      <Modal
        centered
        open={pendingDelete !== null}
        title={t('picoclaw.history.deleteConfirmTitle')}
        okText={t('picoclaw.history.deleteConfirmOk')}
        cancelText={t('picoclaw.history.deleteConfirmCancel')}
        okButtonProps={{ danger: true, loading: isDeleting }}
        onOk={() => {
          if (!pendingDelete) {
            return;
          }
          void Promise.resolve(onDelete(pendingDelete.id)).finally(() => setPendingDelete(null));
        }}
        onCancel={() => setPendingDelete(null)}
      >
        <p className="text-sm text-neutral-400">
          {t('picoclaw.history.deleteConfirmContent', { title: pendingDelete?.title || '' })}
        </p>
      </Modal>
    </>
  );
};

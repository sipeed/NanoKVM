import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Spin } from 'antd';
import { PlusIcon, SquareTerminalIcon, UsbIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';
import type { TerminalSession } from '@/api/vm.ts';
import { ButtonBase } from '@/components/ui/button-base.tsx';

type TerminalSessionPickerProps = {
  open: boolean;
  onClose: () => void;
};

// TerminalSessionPicker asks whether to reuse a previous session or start a new
// one. The "new session" entry always stays on top of the list.
export const TerminalSessionPicker = ({ open, onClose }: TerminalSessionPickerProps) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(() => {
    const request = requestRef.current + 1;
    requestRef.current = request;
    setIsLoading(true);

    api
      .getTerminalSessions()
      .then((rsp) => {
        if (requestRef.current !== request) return;
        if (rsp.code === 0) {
          setSessions(rsp.data?.sessions ?? []);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (requestRef.current === request) {
          setIsLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  function openTerminal(session?: TerminalSession) {
    const url = session
      ? `/#terminal?session=${encodeURIComponent(session.id)}`
      : '/#terminal';

    onClose();
    window.open(url, '_blank');
  }

  function sessionTitle(session: TerminalSession) {
    const name = session.name?.trim();
    if (name) return name;

    return session.kind === 'serial' ? t('terminal.serial') : t('terminal.nanokvm');
  }

  function sessionDetail(session: TerminalSession) {
    const parts: string[] = [];
    if (session.kind === 'serial' && session.port) {
      parts.push(`${session.port} @ ${session.baud || '-'}`);
    }
    parts.push(
      session.attached ? t('settings.terminal.attached') : t('settings.terminal.detached')
    );

    return parts.join(' · ');
  }

  const rowClassName =
    'flex w-full items-center space-x-2 rounded-md bg-[#222222] px-3 py-2 text-left transition-colors hover:bg-[#313131]';

  return (
    <Modal
      open={open}
      title={t('terminal.selectSession')}
      footer={null}
      width={440}
      centered
      zIndex={1100}
      onCancel={onClose}
      destroyOnHidden
    >
      <div className="flex flex-col space-y-2">
        <ButtonBase className={rowClassName} onClick={() => openTerminal()}>
          <span className="shrink-0 text-neutral-400">
            <PlusIcon size={15} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm text-neutral-200">{t('terminal.newSession')}</span>
            <span className="truncate text-xs text-neutral-500">{t('terminal.nanokvm')}</span>
          </span>
        </ButtonBase>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spin />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-4 text-center text-xs text-neutral-500">
            {t('terminal.noSessions')}
          </div>
        ) : (
          <div className="flex max-h-[45vh] flex-col space-y-2 overflow-y-auto">
            {sessions.map((session) => (
              <ButtonBase
                key={session.id}
                className={rowClassName}
                onClick={() => openTerminal(session)}
              >
                <span className="shrink-0 text-neutral-400">
                  {session.kind === 'serial' ? <UsbIcon size={15} /> : <SquareTerminalIcon size={15} />}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-neutral-200">{sessionTitle(session)}</span>
                  <span className="truncate text-xs text-neutral-500">
                    {sessionDetail(session)}
                  </span>
                </span>
              </ButtonBase>
            ))}
          </div>
        )}

        <span className="text-xs text-neutral-500">{t('terminal.reuseHint')}</span>
      </div>
    </Modal>
  );
};

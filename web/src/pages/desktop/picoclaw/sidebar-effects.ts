import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { TFunction } from 'i18next';

import { closeGateway, connectGateway, picoclawGateway } from '@/api/picoclaw.ts';
import {
  clearPicoclawRuntimeInstallSnapshot,
  setPicoclawRuntimeInstallSnapshot,
  type PicoclawRuntimeInstallSnapshot
} from '@/lib/picoclaw-storage.ts';
import type {
  PicoclawChatMessage,
  PicoclawOverlayState,
  PicoclawRunState,
  PicoclawRuntimeStatus,
  PicoclawTakeoverState,
  PicoclawTransportState
} from '@/jotai/picoclaw.ts';

import {
  createAssistantMessage,
  createErrorMessage,
  createObservationMessage,
  createStatusMessage,
  createToolActionMessage,
  HIDDEN_OVERLAY,
  retainLatestObservationScreenshot
} from './message-utils.ts';
import { canConnectGateway, isPicoclawRuntimeInstalling } from './runtime-view.ts';

type MessageSetter = Dispatch<SetStateAction<PicoclawChatMessage[]>>;
type TakeoverSetter = Dispatch<SetStateAction<PicoclawTakeoverState>>;

type GatewayEventOptions = {
  t: TFunction;
  setActiveSessionId: Dispatch<SetStateAction<string>>;
  setTakeover: TakeoverSetter;
  setMessages: MessageSetter;
  setTransportState: Dispatch<SetStateAction<PicoclawTransportState>>;
  setOverlay: Dispatch<SetStateAction<PicoclawOverlayState>>;
  setRunState: Dispatch<SetStateAction<PicoclawRunState>>;
};

type LifecycleOptions = {
  t: TFunction;
  refreshStateRef: MutableRefObject<() => Promise<PicoclawRuntimeStatus | null>>;
  setActiveSessionId: Dispatch<SetStateAction<string>>;
  setIsFreshConversation: Dispatch<SetStateAction<boolean>>;
  setMessages: MessageSetter;
  setIsInitializing: Dispatch<SetStateAction<boolean>>;
  setTakeover: TakeoverSetter;
  setOverlay: Dispatch<SetStateAction<PicoclawOverlayState>>;
  setTransportState: Dispatch<SetStateAction<PicoclawTransportState>>;
  setRunState: Dispatch<SetStateAction<PicoclawRunState>>;
};

type InstallSnapshotOptions = {
  t: TFunction;
  runtimeStatus: PicoclawRuntimeStatus | null;
  setInstallSnapshot: Dispatch<SetStateAction<PicoclawRuntimeInstallSnapshot | null>>;
  previousInstallStateRef: MutableRefObject<{ installing: boolean; status: string }>;
  setMessages: MessageSetter;
};

export function usePicoclawGatewayEvents({
  t,
  setActiveSessionId,
  setTakeover,
  setMessages,
  setTransportState,
  setOverlay,
  setRunState
}: GatewayEventOptions) {
  useEffect(() => {
    const unsubs = [
      picoclawGateway.on('connected', ({ sessionId }) => {
        setActiveSessionId(sessionId);
        setTakeover({
          active: true,
          sessionId,
          reason: 'connected'
        });
        setMessages((current) => [...current, createStatusMessage(t('picoclaw.status.connected'))]);
      }),
      picoclawGateway.on('transport_state', (state) => {
        setTransportState(state);

        if (state === 'connected') {
          setActiveSessionId(picoclawGateway.getSessionId());
          setTakeover((current) => ({
            active: true,
            sessionId: current.sessionId || picoclawGateway.getSessionId(),
            reason: state
          }));
          return;
        }

        setTakeover((current) => ({
          ...current,
          active: false,
          reason: state
        }));
        setOverlay(HIDDEN_OVERLAY);
        setRunState('idle');
      }),
      picoclawGateway.on('run_state', (state) => {
        setRunState(state);
      }),
      picoclawGateway.on('assistant_message', (message) => {
        setMessages((current) => {
          const existingIndex = current.findIndex((item) => item.id === message.id);
          const nextMessage = createAssistantMessage(message);

          if (existingIndex < 0) {
            return [...current, nextMessage];
          }

          const updated = [...current];
          updated[existingIndex] = nextMessage;
          return updated;
        });
      }),
      picoclawGateway.on('tool_action', (action) => {
        setMessages((current) => [...current, createToolActionMessage(action)]);
        setOverlay({
          visible: true,
          message: `${t('picoclaw.overlay.locked')} · ${action.action}`,
          x: action.x,
          y: action.y,
          action: action.action
        });
      }),
      picoclawGateway.on('observation', (observation) => {
        setMessages((current) =>
          retainLatestObservationScreenshot([...current, createObservationMessage(observation)])
        );
      }),
      picoclawGateway.on('error', (error) => {
        setMessages((current) => [...current, createErrorMessage(error)]);
      }),
      picoclawGateway.on('close', (closeEvent) => {
        if (closeEvent.code === 1000) {
          setMessages((current) => [
            ...current,
            createStatusMessage(t('picoclaw.status.disconnected'))
          ]);
        }
      })
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [setActiveSessionId, setMessages, setOverlay, setRunState, setTakeover, setTransportState, t]);
}

export function usePicoclawSidebarLifecycle({
  t,
  refreshStateRef,
  setActiveSessionId,
  setIsFreshConversation,
  setMessages,
  setIsInitializing,
  setTakeover,
  setOverlay,
  setTransportState,
  setRunState
}: LifecycleOptions) {
  useEffect(() => {
    let cancelled = false;

    async function openSidebar() {
      const nextSessionId = picoclawGateway.rotateSession();
      setActiveSessionId(nextSessionId);
      setIsFreshConversation(true);
      setMessages([]);
      try {
        const nextRuntimeStatus = await refreshStateRef.current();
        if (cancelled) {
          return;
        }

        if (nextRuntimeStatus?.installing) {
          setMessages((current) => [
            ...current,
            createStatusMessage(t('picoclaw.install.installing'))
          ]);
          return;
        }

        if (nextRuntimeStatus?.installed === false) {
          setMessages((current) => [
            ...current,
            createStatusMessage(t('picoclaw.install.requiredDescription'))
          ]);
          return;
        }

        if (nextRuntimeStatus?.model_configured === false) {
          setMessages((current) => [
            ...current,
            createStatusMessage(t('picoclaw.model.requiredDescription'))
          ]);
          return;
        }

        if (!canConnectGateway(nextRuntimeStatus ?? null)) {
          return;
        }

        setMessages((current) => [
          ...current,
          createStatusMessage(t('picoclaw.status.connecting'))
        ]);
        try {
          await connectGateway();
        } catch {
          // handled by gateway events
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    void openSidebar();

    return () => {
      cancelled = true;
      closeGateway();
      setTakeover((current) => ({
        ...current,
        active: false,
        reason: 'panel_closed'
      }));
      setOverlay(HIDDEN_OVERLAY);
      setTransportState('disconnected');
      setRunState('idle');
    };
  }, [
    refreshStateRef,
    setActiveSessionId,
    setIsFreshConversation,
    setIsInitializing,
    setMessages,
    setOverlay,
    setRunState,
    setTakeover,
    setTransportState,
    t
  ]);
}

export function usePicoclawInstallRefresh(
  isRuntimeInstallActive: boolean,
  refreshStateRef: MutableRefObject<() => Promise<PicoclawRuntimeStatus | null>>
) {
  useEffect(() => {
    if (!isRuntimeInstallActive) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshStateRef.current();
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isRuntimeInstallActive, refreshStateRef]);
}

export function usePicoclawInstallSnapshotSync({
  t,
  runtimeStatus,
  setInstallSnapshot,
  previousInstallStateRef,
  setMessages
}: InstallSnapshotOptions) {
  useEffect(() => {
    if (!runtimeStatus) {
      return;
    }

    const isInstalling = isPicoclawRuntimeInstalling(runtimeStatus);

    if (isInstalling) {
      const nextSnapshot = {
        installing: true,
        installProgress: runtimeStatus.install_progress,
        installStage: runtimeStatus.install_stage,
        status: runtimeStatus.status
      };
      setInstallSnapshot(nextSnapshot);
      setPicoclawRuntimeInstallSnapshot(nextSnapshot);
    } else {
      setInstallSnapshot(null);
      clearPicoclawRuntimeInstallSnapshot();
    }

    const previous = previousInstallStateRef.current;
    if (previous.installing && !isInstalling) {
      if (runtimeStatus.installed === true) {
        setMessages((current) => [...current, createStatusMessage(t('picoclaw.install.success'))]);
      } else {
        setMessages((current) => [
          ...current,
          createErrorMessage({
            code: (runtimeStatus.status || 'runtime_install_failed').toUpperCase(),
            message: runtimeStatus.last_error || t('picoclaw.install.failed'),
            raw: runtimeStatus
          })
        ]);
      }
    }

    previousInstallStateRef.current = {
      installing: isInstalling,
      status: runtimeStatus.status
    };
  }, [runtimeStatus, setInstallSnapshot, setMessages, t, previousInstallStateRef]);
}

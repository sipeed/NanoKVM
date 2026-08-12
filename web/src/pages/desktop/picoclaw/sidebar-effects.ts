import { useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { TFunction } from 'i18next';

import { closeGateway, connectGateway, picoclawGateway } from '@/api/picoclaw.ts';
import {
  clearPicoclawRuntimeInstallSnapshot,
  setPicoclawRuntimeInstallSnapshot,
  type PicoclawRuntimeInstallSnapshot
} from '@/lib/picoclaw-storage.ts';
import { normalizeAIControlStatus, type AIControlStatus } from '@/jotai/ai-control.ts';
import type {
  PicoclawChatMessage,
  PicoclawOverlayState,
  PicoclawRunState,
  PicoclawRuntimeStatus,
  PicoclawTakeoverState,
  PicoclawTransportState
} from '@/jotai/picoclaw.ts';

import { PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE, releasePicoclawInputFocus } from './keyboard-lock.ts';
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
import type { PicoclawRefreshOptions } from './sidebar-actions.ts';

type MessageSetter = Dispatch<SetStateAction<PicoclawChatMessage[]>>;
type TakeoverSetter = Dispatch<SetStateAction<PicoclawTakeoverState>>;
type AIControlStatusSetter = Dispatch<SetStateAction<AIControlStatus | null>>;
type KeyboardLockSetter = (action: { source: string; locked: boolean }) => void;

const STATUS_CONFIRM_TIMEOUT_MS = 10_000;
const STATUS_CONFIRM_INTERVAL_MS = 500;
const STATUS_REFRESH_INTERVAL_MS = 3000;

type GatewayEventOptions = {
  t: TFunction;
  refreshStateRef: MutableRefObject<
    (options?: PicoclawRefreshOptions) => Promise<PicoclawRuntimeStatus | null>
  >;
  setActiveSessionId: Dispatch<SetStateAction<string>>;
  setTakeover: TakeoverSetter;
  setMessages: MessageSetter;
  setTransportState: Dispatch<SetStateAction<PicoclawTransportState>>;
  setOverlay: Dispatch<SetStateAction<PicoclawOverlayState>>;
  setRunState: Dispatch<SetStateAction<PicoclawRunState>>;
  setRuntimeStatus: Dispatch<SetStateAction<PicoclawRuntimeStatus | null>>;
  setAIControlStatus: AIControlStatusSetter;
  setKeyboardLock: KeyboardLockSetter;
  isTogglingRuntimeRef: MutableRefObject<boolean>;
};

type LifecycleOptions = {
  t: TFunction;
  refreshStateRef: MutableRefObject<
    (options?: PicoclawRefreshOptions) => Promise<PicoclawRuntimeStatus | null>
  >;
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

type GatewayAutoConnectOptions = {
  activeSessionId: string;
  runtimeStatus: PicoclawRuntimeStatus | null;
  transportState: PicoclawTransportState;
  disabled?: boolean;
};

export function usePicoclawGatewayEvents({
  t,
  refreshStateRef,
  setActiveSessionId,
  setTakeover,
  setMessages,
  setTransportState,
  setOverlay,
  setRunState,
  setRuntimeStatus,
  setAIControlStatus,
  setKeyboardLock,
  isTogglingRuntimeRef
}: GatewayEventOptions) {
  useEffect(() => {
    let disposed = false;

    function syncAIControlStatus(value: unknown, source: string) {
      const nextControlStatus = normalizeAIControlStatus(value, source);
      if (nextControlStatus) {
        setAIControlStatus(nextControlStatus);
      }
    }

    async function confirmRuntimeStatus(source: string) {
      const deadline = Date.now() + STATUS_CONFIRM_TIMEOUT_MS;
      while (!disposed && Date.now() < deadline) {
        const status = await refreshStateRef.current();
        if (status && status.transitioning !== true) {
          syncAIControlStatus(status, source);
          return status;
        }
        await new Promise((resolve) => window.setTimeout(resolve, STATUS_CONFIRM_INTERVAL_MS));
      }
      return null;
    }

    function clearActiveGatewayUI(reason: string) {
      releasePicoclawInputFocus();
      setKeyboardLock({ source: PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE, locked: false });
      setTakeover((current) => ({
        ...current,
        active: false,
        reason
      }));
      setOverlay(HIDDEN_OVERLAY);
      setTransportState('disconnected');
      setRunState('idle');
    }

    function clearDeviceControlUI(reason: string) {
      releasePicoclawInputFocus();
      setKeyboardLock({ source: PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE, locked: false });
      setTakeover((current) => ({
        ...current,
        active: false,
        reason
      }));
      setOverlay(HIDDEN_OVERLAY);
      setRunState('idle');
    }

    function markRuntimeTransportUnavailable(reason: string) {
      releasePicoclawInputFocus();
      setKeyboardLock({ source: PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE, locked: false });
      setTakeover((current) => ({
        ...current,
        active: false,
        reason
      }));
      setOverlay(HIDDEN_OVERLAY);
      setRunState('idle');
      void refreshStateRef.current({
        force: true,
        preserveRuntimeOnError: true
      });
    }

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

        if (state === 'error') {
          markRuntimeTransportUnavailable('transport_error');
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
      picoclawGateway.on('control_mode_changed', (control) => {
        syncAIControlStatus(control, control.source ?? 'gateway');
        setRuntimeStatus((current) =>
          current
            ? {
                ...current,
                control_mode: control.mode,
                transitioning: control.transitioning,
                control,
                capabilities: {
                  chat: current.capabilities?.chat ?? current.ready === true,
                  read_only_tools: current.capabilities?.read_only_tools ?? current.ready === true,
                  device_write: control.can_control
                }
              }
            : current
        );
        if (!control.can_control) {
          if (control.mode === 'mcp') {
            clearActiveGatewayUI('control_mcp');
          } else {
            clearDeviceControlUI('control_released');
          }
        }
      }),
      picoclawGateway.on('close', (closeEvent) => {
        if (closeEvent.code === 4006) {
          clearActiveGatewayUI('control_mode_switched');
          setAIControlStatus((current) =>
            current
              ? {
                  ...current,
                  transitioning: true,
                  canControlPicoclaw: false,
                  source: 'gateway_close'
                }
              : current
          );
          setRuntimeStatus((current) =>
            current
              ? {
                  ...current,
                  transitioning: true
                }
              : current
          );
          void confirmRuntimeStatus('gateway_close').then((status) => {
            if (disposed || status?.control_mode !== 'mcp') return;
            setMessages((current) => [
              ...current,
              createStatusMessage(t('picoclaw.status.controlSwitchedToMCP'))
            ]);
          });
          return;
        }
        if (closeEvent.code === 4007) {
          clearActiveGatewayUI('runtime_stopped');
          setAIControlStatus((current) =>
            current
              ? {
                  ...current,
                  mode: current.mode === 'picoclaw' ? 'off' : current.mode,
                  transitioning: false,
                  canControlPicoclaw: false,
                  source: 'gateway_runtime_stopped'
                }
              : current
          );
          setRuntimeStatus((current) =>
            current
              ? {
                  ...current,
                  ready: false,
                  status: 'stopped',
                  current_session: '',
                  control_mode: current.control_mode === 'picoclaw' ? 'off' : current.control_mode,
                  transitioning: false,
                  control: current.control
                    ? {
                        ...current.control,
                        mode: current.control.mode === 'picoclaw' ? 'off' : current.control.mode,
                        transitioning: false,
                        can_control: false
                      }
                    : current.control,
                  capabilities: {
                    chat: false,
                    read_only_tools: false,
                    device_write: false
                  }
                }
              : current
          );
          void confirmRuntimeStatus('gateway_runtime_stopped');
          if (!isTogglingRuntimeRef.current) {
            setMessages((current) => [
              ...current,
              createStatusMessage(t('picoclaw.status.runtimeStopped'))
            ]);
          }
          return;
        }
        if (closeEvent.code === 1000) {
          setMessages((current) => [
            ...current,
            createStatusMessage(t('picoclaw.status.disconnected'))
          ]);
        }
      })
    ];

    return () => {
      disposed = true;
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [
    setActiveSessionId,
    setMessages,
    setOverlay,
    setRunState,
    setRuntimeStatus,
    setAIControlStatus,
    setKeyboardLock,
    setTakeover,
    setTransportState,
    isTogglingRuntimeRef,
    t,
    refreshStateRef
  ]);
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
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

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
            createStatusMessage(tRef.current('picoclaw.install.installing'))
          ]);
          return;
        }

        if (nextRuntimeStatus?.installed === false) {
          setMessages((current) => [
            ...current,
            createStatusMessage(tRef.current('picoclaw.install.requiredDescription'))
          ]);
          return;
        }

        if (nextRuntimeStatus?.model_configured === false) {
          setMessages((current) => [
            ...current,
            createStatusMessage(tRef.current('picoclaw.model.requiredDescription'))
          ]);
          return;
        }

        if (!canConnectGateway(nextRuntimeStatus ?? null)) {
          return;
        }

        setMessages((current) => [
          ...current,
          createStatusMessage(tRef.current('picoclaw.status.connecting'))
        ]);
        try {
          await connectGateway(nextSessionId);
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
      void closeGateway();
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
    setTransportState
  ]);
}

export function usePicoclawInstallRefresh(
  isRuntimeInstallActive: boolean,
  refreshStateRef: MutableRefObject<
    (options?: PicoclawRefreshOptions) => Promise<PicoclawRuntimeStatus | null>
  >
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

export function usePicoclawGatewayAutoConnect({
  activeSessionId,
  runtimeStatus,
  transportState,
  disabled
}: GatewayAutoConnectOptions) {
  const lastAttemptAtRef = useRef(0);

  useEffect(() => {
    if (
      disabled ||
      !canConnectGateway(runtimeStatus) ||
      transportState === 'connected' ||
      transportState === 'connecting'
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastAttemptAtRef.current < STATUS_REFRESH_INTERVAL_MS) {
      return;
    }

    lastAttemptAtRef.current = now;
    void connectGateway(activeSessionId || undefined).catch(() => undefined);
  }, [activeSessionId, runtimeStatus, transportState, disabled]);
}

export function usePicoclawStatusRefresh(
  disabled: boolean,
  refreshStateRef: MutableRefObject<
    (options?: PicoclawRefreshOptions) => Promise<PicoclawRuntimeStatus | null>
  >
) {
  useEffect(() => {
    if (disabled) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshStateRef.current();
    }, STATUS_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [disabled, refreshStateRef]);
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

import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { TFunction } from 'i18next';

import {
  closeGateway,
  connectGateway,
  getRuntimeStatus,
  installRuntime,
  picoclawGateway,
  setAIControlMode,
  setPicoclawAgentProfile,
  setPicoclawModelConfig,
  startRuntime,
  stopRuntime,
  uninstallRuntime
} from '@/api/picoclaw.ts';
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
import { createErrorMessage, createStatusMessage, HIDDEN_OVERLAY } from './message-utils.ts';

type RuntimeStatusSetter = Dispatch<SetStateAction<PicoclawRuntimeStatus | null>>;
type AIControlStatusSetter = Dispatch<SetStateAction<AIControlStatus | null>>;
type MessageSetter = Dispatch<SetStateAction<PicoclawChatMessage[]>>;
type TakeoverSetter = Dispatch<SetStateAction<PicoclawTakeoverState>>;
type KeyboardLockSetter = (action: { source: string; locked: boolean }) => void;

export type PicoclawMutation =
  | 'none'
  | 'control_grant'
  | 'control_release'
  | 'runtime_start'
  | 'runtime_stop'
  | 'runtime_install'
  | 'runtime_uninstall'
  | 'agent_switch'
  | 'model_save'
  | 'session_switch';

export type PicoclawRefreshOptions = {
  force?: boolean;
  preserveRuntimeOnError?: boolean;
  allowDuringMutation?: boolean;
};

type PicoclawSidebarActionOptions = {
  t: TFunction;
  runtimeStatus: PicoclawRuntimeStatus | null;
  transportState: PicoclawTransportState;
  installSnapshot: PicoclawRuntimeInstallSnapshot | null;
  modelApiBase: string;
  modelApiKey: string;
  modelIdentifier: string;
  refreshStatePromiseRef: MutableRefObject<Promise<PicoclawRuntimeStatus | null> | null>;
  mutationRef: MutableRefObject<PicoclawMutation>;
  mutationEpochRef: MutableRefObject<number>;
  refreshRequestSeqRef: MutableRefObject<number>;
  setRuntimeStatus: RuntimeStatusSetter;
  setAIControlStatus: AIControlStatusSetter;
  setMessages: MessageSetter;
  setTakeover: TakeoverSetter;
  setOverlay: Dispatch<SetStateAction<PicoclawOverlayState>>;
  setTransportState: Dispatch<SetStateAction<PicoclawTransportState>>;
  setRunState: Dispatch<SetStateAction<PicoclawRunState>>;
  setIsModelConfigOpen: Dispatch<SetStateAction<boolean>>;
  setIsTogglingRuntime: Dispatch<SetStateAction<boolean>>;
  setIsInstallRequestPending: Dispatch<SetStateAction<boolean>>;
  setInstallSnapshot: Dispatch<SetStateAction<PicoclawRuntimeInstallSnapshot | null>>;
  setIsSavingModelConfig: Dispatch<SetStateAction<boolean>>;
  setIsSwitchingAgent: Dispatch<SetStateAction<boolean>>;
  setIsUninstallRequestPending: Dispatch<SetStateAction<boolean>>;
  setIsReleasingControl: Dispatch<SetStateAction<boolean>>;
  setPicoclawMutation: Dispatch<SetStateAction<PicoclawMutation>>;
  setKeyboardLock: KeyboardLockSetter;
};

export function createPicoclawSidebarActions(options: PicoclawSidebarActionOptions) {
  const {
    t,
    runtimeStatus,
    transportState,
    installSnapshot,
    modelApiBase,
    modelApiKey,
    modelIdentifier,
    refreshStatePromiseRef,
    mutationRef,
    mutationEpochRef,
    refreshRequestSeqRef,
    setRuntimeStatus,
    setAIControlStatus,
    setMessages,
    setTakeover,
    setOverlay,
    setTransportState,
    setRunState,
    setIsModelConfigOpen,
    setIsTogglingRuntime,
    setIsInstallRequestPending,
    setInstallSnapshot,
    setIsSavingModelConfig,
    setIsSwitchingAgent,
    setIsUninstallRequestPending,
    setIsReleasingControl,
    setPicoclawMutation,
    setKeyboardLock
  } = options;

  function syncAIControlStatus(value: unknown, source: string) {
    const nextControlStatus = normalizeAIControlStatus(value, source);
    if (nextControlStatus) {
      setAIControlStatus(nextControlStatus);
    }
  }

  function syncRuntimeStatus(status: PicoclawRuntimeStatus, source = 'picoclaw_runtime_status') {
    setRuntimeStatus(status);
    syncAIControlStatus(status, source);
    return status;
  }

  function beginMutation(mutation: PicoclawMutation) {
    if (mutationRef.current !== 'none') {
      return false;
    }

    mutationRef.current = mutation;
    mutationEpochRef.current += 1;
    refreshStatePromiseRef.current = null;
    setPicoclawMutation(mutation);
    return true;
  }

  function endMutation(mutation: PicoclawMutation) {
    if (mutationRef.current !== mutation) {
      return;
    }

    mutationRef.current = 'none';
    mutationEpochRef.current += 1;
    refreshStatePromiseRef.current = null;
    setPicoclawMutation('none');
  }

  function markRuntimeStatusUnavailable(source: string) {
    releasePicoclawInputFocus();
    setKeyboardLock({ source: PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE, locked: false });
    setTakeover((current) => ({
      ...current,
      active: false,
      reason: source
    }));
    setOverlay(HIDDEN_OVERLAY);
    setTransportState('error');
    setRunState('idle');
    setAIControlStatus((current) =>
      current
        ? {
            ...current,
            canControlPicoclaw: false,
            source
          }
        : current
    );
    setRuntimeStatus((current) => {
      if (
        !current ||
        current.installing ||
        (current.ready !== true &&
          current.status !== 'ready' &&
          current.capabilities?.chat !== true)
      ) {
        return current;
      }

      return {
        ...current,
        ready: false,
        restoring: false,
        status: 'unavailable',
        current_session: '',
        control: current.control
          ? {
              ...current.control,
              can_control: false
            }
          : current.control,
        capabilities: {
          chat: false,
          read_only_tools: false,
          device_write: false
        }
      };
    });
  }

  async function refreshState(options: PicoclawRefreshOptions = {}) {
    const force = options.force === true;
    if (!force && mutationRef.current !== 'none' && options.allowDuringMutation !== true) {
      return runtimeStatus;
    }

    if (!force && refreshStatePromiseRef.current) {
      return refreshStatePromiseRef.current;
    }

    const requestId = refreshRequestSeqRef.current + 1;
    refreshRequestSeqRef.current = requestId;
    const requestEpoch = mutationEpochRef.current;
    const refreshPromise = (async () => {
      let runtimeRsp;

      try {
        runtimeRsp = await getRuntimeStatus();
      } catch {
        if (options.preserveRuntimeOnError !== true) {
          markRuntimeStatusUnavailable('runtime_status_unavailable');
        }
        return null;
      }

      if (runtimeRsp.code === 0) {
        const nextStatus = runtimeRsp.data as PicoclawRuntimeStatus;
        const canCommit =
          requestId === refreshRequestSeqRef.current &&
          (force || requestEpoch === mutationEpochRef.current) &&
          (mutationRef.current === 'none' || options.allowDuringMutation === true);
        return canCommit ? syncRuntimeStatus(nextStatus) : nextStatus;
      }

      if (options.preserveRuntimeOnError !== true) {
        markRuntimeStatusUnavailable('runtime_status_error');
      }
      return null;
    })();

    if (!force) {
      refreshStatePromiseRef.current = refreshPromise;
    }
    try {
      return await refreshPromise;
    } finally {
      if (!force && refreshStatePromiseRef.current === refreshPromise) {
        refreshStatePromiseRef.current = null;
      }
    }
  }

  function isUnexpectedEOFError(error: unknown) {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();
    return message.includes('unexpected eof') || message === 'eof';
  }

  function isExpectedRuntimeState(status: PicoclawRuntimeStatus | null, shouldStop: boolean) {
    if (!status) {
      return false;
    }

    const controlMode = status.control?.mode ?? status.control_mode;
    const isTransitioning = status.control?.transitioning === true || status.transitioning === true;

    if (shouldStop) {
      return (
        status.ready === false &&
        status.status === 'stopped' &&
        status.runtime_intent?.desired_running === false &&
        controlMode === 'off'
      );
    }

    return (
      status.ready === true &&
      status.status === 'ready' &&
      status.installed !== false &&
      status.installing !== true &&
      status.model_configured !== false &&
      controlMode === 'picoclaw' &&
      !isTransitioning &&
      status.runtime_intent?.desired_running === true
    );
  }

  function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  function parseRuntimeStatus(value: unknown) {
    if (!isObject(value)) {
      return null;
    }
    if (typeof value.ready !== 'boolean' || typeof value.control_mode !== 'string') {
      return null;
    }
    return value as PicoclawRuntimeStatus;
  }

  function runtimeStatusFromResponse(response: unknown) {
    if (!isObject(response)) {
      return null;
    }
    const data = response.data;
    if (!isObject(data)) {
      return null;
    }
    return parseRuntimeStatus(data.status) ?? parseRuntimeStatus(data.runtime);
  }

  function responseCode(response: unknown) {
    if (!isObject(response)) {
      return undefined;
    }
    return response.code;
  }

  function responseMessage(response: unknown) {
    if (!isObject(response)) {
      return '';
    }

    const message = response.message || response.msg;
    return typeof message === 'string' ? message : '';
  }

  function runtimeStatusError(status: PicoclawRuntimeStatus | null) {
    return status?.last_error || status?.config_error || '';
  }

  function responseCleanupWarning(response: unknown) {
    if (!isObject(response) || !isObject(response.data)) {
      return '';
    }
    const warning = response.data.cleanup_warning;
    return typeof warning === 'string' ? warning : '';
  }

  function debugTiming(label: string, startedAt: number, fields?: Record<string, unknown>) {
    if (typeof console === 'undefined' || typeof console.debug !== 'function') {
      return;
    }
    console.debug('[picoclaw]', label, {
      ...(fields ?? {}),
      elapsedMs: Math.round(performance.now() - startedAt)
    });
  }

  function setRuntimeControlStatus(mode: 'off' | 'mcp' | 'picoclaw', transitioning: boolean) {
    setRuntimeStatus((current) =>
      current
        ? {
            ...current,
            control_mode: mode,
            transitioning,
            control: {
              ...(current.control ?? {
                mode,
                transitioning,
                can_control: false
              }),
              mode,
              transitioning,
              can_control: mode === 'picoclaw' && !transitioning
            },
            capabilities: {
              chat: current.capabilities?.chat ?? current.ready === true,
              read_only_tools: current.capabilities?.read_only_tools ?? current.ready === true,
              device_write: mode === 'picoclaw' && !transitioning
            }
          }
        : current
    );
  }

  async function applyRuntimeToggleSuccess(status: PicoclawRuntimeStatus, shouldStop: boolean) {
    syncRuntimeStatus(status, shouldStop ? 'runtime_stop' : 'runtime_start');
    setMessages((current) => [
      ...current,
      createStatusMessage(
        t(shouldStop ? 'picoclaw.status.runtimeStopped' : 'picoclaw.status.runtimeStarted')
      )
    ]);

    if (shouldStop) {
      void closeGateway();
      setTakeover({
        active: false,
        sessionId: picoclawGateway.getSessionId(),
        reason: 'runtime_stopped'
      });
      setOverlay(HIDDEN_OVERLAY);
      setTransportState('disconnected');
      setRunState('idle');
      return;
    }

    if (transportState !== 'connected') {
      try {
        await connectGateway();
      } catch {
        // handled by gateway events
      }
    }
  }

  async function confirmRuntimeToggleResult(shouldStop: boolean) {
    const attempts = 5;

    for (let index = 0; index < attempts; index += 1) {
      const latestRuntimeStatus = await refreshState({
        force: true,
        preserveRuntimeOnError: true,
        allowDuringMutation: true
      });
      if (latestRuntimeStatus && isExpectedRuntimeState(latestRuntimeStatus, shouldStop)) {
        await applyRuntimeToggleSuccess(latestRuntimeStatus, shouldStop);
        return latestRuntimeStatus;
      }
      if (index < attempts - 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
      }
    }

    return null;
  }

  function runtimeToggleFailureMessage(
    raw: unknown,
    status: PicoclawRuntimeStatus | null,
    shouldStop: boolean
  ) {
    if (raw instanceof Error && !isUnexpectedEOFError(raw)) {
      return raw.message;
    }

    return (
      responseMessage(raw) ||
      runtimeStatusError(status) ||
      t(shouldStop ? 'picoclaw.status.runtimeStopFailed' : 'picoclaw.status.runtimeStartFailed')
    );
  }

  async function handleStartRuntime() {
    const isRuntimeReady = runtimeStatus?.ready === true;
    const mutation: PicoclawMutation = isRuntimeReady ? 'runtime_stop' : 'runtime_start';
    if (!beginMutation(mutation)) {
      return;
    }

    setIsTogglingRuntime(true);

    try {
      let response;

      try {
        response = isRuntimeReady ? await stopRuntime() : await startRuntime();
      } catch (error) {
        const confirmedStatus = await confirmRuntimeToggleResult(isRuntimeReady);
        if (confirmedStatus) {
          return;
        }

        setMessages((current) => [
          ...current,
          createErrorMessage({
            code: isRuntimeReady ? 'RUNTIME_STOP_FAILED' : 'RUNTIME_START_FAILED',
            message: runtimeToggleFailureMessage(error, null, isRuntimeReady),
            raw: error
          })
        ]);
        return;
      }

      const responseStatus = runtimeStatusFromResponse(response);
      if (
        responseCode(response) === 0 &&
        responseStatus &&
        isExpectedRuntimeState(responseStatus, isRuntimeReady)
      ) {
        await applyRuntimeToggleSuccess(responseStatus, isRuntimeReady);
      } else if (await confirmRuntimeToggleResult(isRuntimeReady)) {
        return;
      } else {
        if (responseStatus) {
          syncRuntimeStatus(responseStatus, isRuntimeReady ? 'runtime_stop' : 'runtime_start');
        }
        setMessages((current) => [
          ...current,
          createErrorMessage({
            code: isRuntimeReady ? 'RUNTIME_STOP_FAILED' : 'RUNTIME_START_FAILED',
            message: runtimeToggleFailureMessage(response, responseStatus, isRuntimeReady),
            raw: response
          })
        ]);
      }

      await refreshState({ force: true, allowDuringMutation: true });
    } finally {
      setIsTogglingRuntime(false);
      endMutation(mutation);
    }
  }

  async function handleGrantControl() {
    if (!beginMutation('control_grant')) {
      return false;
    }

    try {
      const response = await setAIControlMode('picoclaw');
      if (response.code !== 0) {
        const errorMessage = responseMessage(response) || t('picoclaw.control.grantFailed');
        setMessages((current) => [
          ...current,
          createErrorMessage({
            code: 'CONTROL_SWITCH_FAILED',
            message: errorMessage,
            raw: response
          })
        ]);
        await refreshState({
          force: true,
          preserveRuntimeOnError: true,
          allowDuringMutation: true
        });
        return false;
      }
      syncAIControlStatus(response.data, 'ai_control_mode');
      await refreshState({ force: true, allowDuringMutation: true });
      setMessages((current) => [
        ...current,
        createStatusMessage(
          t('picoclaw.control.granted', { defaultValue: 'PicoClaw control granted' })
        )
      ]);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('picoclaw.control.grantFailed');
      setMessages((current) => [
        ...current,
        createErrorMessage({
          code: 'CONTROL_SWITCH_FAILED',
          message: errorMessage,
          raw: error
        })
      ]);
      await refreshState({
        force: true,
        preserveRuntimeOnError: true,
        allowDuringMutation: true
      });
      return false;
    } finally {
      endMutation('control_grant');
    }
  }

  async function handleReleaseControl() {
    if (!beginMutation('control_release')) {
      return false;
    }

    const totalStartedAt = performance.now();
    setIsReleasingControl(true);
    releasePicoclawInputFocus();
    setKeyboardLock({ source: PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE, locked: false });
    setTakeover({
      active: false,
      sessionId: picoclawGateway.getSessionId(),
      reason: 'control_release_requested'
    });
    setOverlay(HIDDEN_OVERLAY);
    setRunState('idle');
    setAIControlStatus({
      mode: 'off',
      transitioning: true,
      canControlPicoclaw: false,
      source: 'control_release_requested'
    });
    setRuntimeControlStatus('off', true);

    try {
      const switchStartedAt = performance.now();
      const response = await setAIControlMode('off');
      debugTiming('release_control.setAIControlMode', switchStartedAt, {
        code: responseCode(response)
      });
      if (response.code !== 0) {
        const errorMessage = responseMessage(response) || t('picoclaw.control.releaseFailed');
        setMessages((current) => [
          ...current,
          createErrorMessage({
            code: 'CONTROL_SWITCH_FAILED',
            message: errorMessage,
            raw: response
          })
        ]);
        const rollbackStatus = await refreshState({
          force: true,
          preserveRuntimeOnError: true,
          allowDuringMutation: true
        });
        debugTiming('release_control.rollbackRefresh', totalStartedAt, {
          status: rollbackStatus?.status,
          controlMode: rollbackStatus?.control?.mode ?? rollbackStatus?.control_mode
        });
        return false;
      }

      syncAIControlStatus(response.data, 'ai_control_mode');
      const responseStatus = runtimeStatusFromResponse(response);
      if (responseStatus) {
        syncRuntimeStatus(responseStatus, 'ai_control_mode');
      } else {
        setRuntimeControlStatus('off', false);
      }
      setTakeover({
        active: false,
        sessionId: picoclawGateway.getSessionId(),
        reason: 'control_released'
      });
      setOverlay(HIDDEN_OVERLAY);
      setRunState('idle');
      setMessages((current) => [
        ...current,
        createStatusMessage(
          t('picoclaw.control.released', { defaultValue: 'PicoClaw control released' })
        )
      ]);
      const cleanupWarning = responseCleanupWarning(response);
      if (cleanupWarning) {
        setMessages((current) => [
          ...current,
          createErrorMessage({
            code: 'CONTROL_RELEASE_CLEANUP_WARNING',
            message: cleanupWarning,
            raw: response
          })
        ]);
      }
      const refreshStartedAt = performance.now();
      const latestStatus = await refreshState({
        force: true,
        preserveRuntimeOnError: true,
        allowDuringMutation: true
      });
      debugTiming('release_control.refreshState', refreshStartedAt, {
        status: latestStatus?.status,
        controlMode: latestStatus?.control?.mode ?? latestStatus?.control_mode
      });
      const latestControlMode = latestStatus?.control?.mode ?? latestStatus?.control_mode;
      if (latestStatus && latestControlMode !== 'off') {
        setMessages((current) => [
          ...current,
          createErrorMessage({
            code: 'CONTROL_RELEASE_VERIFY_FAILED',
            message: t('picoclaw.control.releaseFailed'),
            raw: latestStatus
          })
        ]);
      }
      debugTiming('release_control.total', totalStartedAt, {
        verifiedControlMode: latestControlMode
      });
      return true;
    } catch (error) {
      debugTiming('release_control.failed', totalStartedAt, {
        message: error instanceof Error ? error.message : String(error)
      });
      const errorMessage =
        error instanceof Error ? error.message : t('picoclaw.control.releaseFailed');
      setMessages((current) => [
        ...current,
        createErrorMessage({
          code: 'CONTROL_SWITCH_FAILED',
          message: errorMessage,
          raw: error
        })
      ]);
      await refreshState({
        force: true,
        preserveRuntimeOnError: true,
        allowDuringMutation: true
      });
      return false;
    } finally {
      setIsReleasingControl(false);
      endMutation('control_release');
    }
  }

  async function handleInstallRuntime() {
    if (!beginMutation('runtime_install')) {
      return;
    }

    setIsInstallRequestPending(true);
    const pendingSnapshot = {
      installing: true,
      installProgress: runtimeStatus?.install_progress ?? installSnapshot?.installProgress ?? 0,
      installStage: runtimeStatus?.install_stage ?? installSnapshot?.installStage ?? 'preparing',
      status: 'installing'
    };
    setInstallSnapshot(pendingSnapshot);
    setPicoclawRuntimeInstallSnapshot(pendingSnapshot);

    try {
      const response = await installRuntime();
      if (response.code === 0) {
        syncRuntimeStatus(response.data.status, 'runtime_install');
        const installFinished =
          response.data.status.status === 'installed' &&
          response.data.status.installing !== true &&
          response.data.installed === true;
        setMessages((current) => [
          ...current,
          createStatusMessage(
            installFinished ? t('picoclaw.install.success') : t('picoclaw.install.installing')
          )
        ]);
        await refreshState({ force: true, allowDuringMutation: true });
        return;
      }

      const errorMessage =
        (response as { message?: string; msg?: string }).message ||
        (response as { message?: string; msg?: string }).msg ||
        t('picoclaw.install.failed');
      setMessages((current) => [
        ...current,
        createErrorMessage({
          code: 'RUNTIME_INSTALL_FAILED',
          message: errorMessage,
          raw: response
        })
      ]);
    } catch (error) {
      setInstallSnapshot(null);
      clearPicoclawRuntimeInstallSnapshot();
      const errorMessage = error instanceof Error ? error.message : t('picoclaw.install.failed');
      setMessages((current) => [
        ...current,
        createErrorMessage({
          code: 'RUNTIME_INSTALL_FAILED',
          message: errorMessage,
          raw: error
        })
      ]);
    } finally {
      setIsInstallRequestPending(false);
      endMutation('runtime_install');
    }
  }

  async function handleSaveModelConfig() {
    const apiBase = modelApiBase.trim();
    const apiKey = modelApiKey.trim();
    const model = modelIdentifier.trim();
    if (!apiBase || !apiKey || !model) {
      setMessages((current) => [
        ...current,
        createErrorMessage({
          code: 'MODEL_CONFIG_INVALID',
          message: t('picoclaw.model.invalid')
        })
      ]);
      return;
    }

    if (!beginMutation('model_save')) {
      return;
    }

    setIsSavingModelConfig(true);
    try {
      const response = await setPicoclawModelConfig({
        model,
        api_base: apiBase,
        api_key: apiKey
      });
      if (response.code === 0) {
        syncRuntimeStatus(response.data.status, 'model_config');
        setIsModelConfigOpen(false);
        setMessages((current) => [...current, createStatusMessage(t('picoclaw.model.saved'))]);
        await refreshState({ force: true, allowDuringMutation: true });
        return;
      }

      const errorMessage =
        (response as { message?: string; msg?: string }).message ||
        (response as { message?: string; msg?: string }).msg ||
        t('picoclaw.model.saveFailed');
      setMessages((current) => [
        ...current,
        createErrorMessage({
          code: 'MODEL_CONFIG_SAVE_FAILED',
          message: errorMessage,
          raw: response
        })
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('picoclaw.model.saveFailed');
      setMessages((current) => [
        ...current,
        createErrorMessage({
          code: 'MODEL_CONFIG_SAVE_FAILED',
          message: errorMessage,
          raw: error
        })
      ]);
    } finally {
      setIsSavingModelConfig(false);
      endMutation('model_save');
    }
  }

  async function handleAgentProfileChange(profile: string) {
    if (!profile || profile === runtimeStatus?.agent_profile) {
      return;
    }

    if (!beginMutation('agent_switch')) {
      return;
    }

    setIsSwitchingAgent(true);
    try {
      const response = await setPicoclawAgentProfile({ profile });
      if (response.code === 0) {
        syncRuntimeStatus(response.data.status, 'agent_profile');
        setMessages((current) => [...current, createStatusMessage(t('picoclaw.agent.switched'))]);
        await refreshState({ force: true, allowDuringMutation: true });

        if (response.data.status?.ready === true && transportState !== 'connected') {
          try {
            await connectGateway();
          } catch {
            // handled by gateway events
          }
        }
        return;
      }

      const errorMessage =
        (response as { message?: string; msg?: string }).message ||
        (response as { message?: string; msg?: string }).msg ||
        t('picoclaw.agent.switchFailed');
      setMessages((current) => [
        ...current,
        createErrorMessage({
          code: 'AGENT_PROFILE_SWITCH_FAILED',
          message: errorMessage,
          raw: response
        })
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('picoclaw.agent.switchFailed');
      setMessages((current) => [
        ...current,
        createErrorMessage({
          code: 'AGENT_PROFILE_SWITCH_FAILED',
          message: errorMessage,
          raw: error
        })
      ]);
    } finally {
      setIsSwitchingAgent(false);
      endMutation('agent_switch');
    }
  }

  async function handleUninstallRuntime() {
    if (!beginMutation('runtime_uninstall')) {
      return;
    }

    setIsUninstallRequestPending(true);
    setMessages((current) => [...current, createStatusMessage(t('picoclaw.install.uninstalling'))]);

    try {
      const response = await uninstallRuntime();
      if (response.code === 0) {
        syncRuntimeStatus(response.data.status, 'runtime_uninstall');
        setMessages((current) => [
          ...current,
          createStatusMessage(t('picoclaw.install.uninstalled'))
        ]);
        await refreshState({ force: true, allowDuringMutation: true });
        return;
      }

      const errorMessage =
        (response as { message?: string; msg?: string }).message ||
        (response as { message?: string; msg?: string }).msg ||
        t('picoclaw.install.uninstallFailed');
      setMessages((current) => [
        ...current,
        createErrorMessage({
          code: 'RUNTIME_UNINSTALL_FAILED',
          message: errorMessage,
          raw: response
        })
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('picoclaw.install.uninstallFailed');
      setMessages((current) => [
        ...current,
        createErrorMessage({
          code: 'RUNTIME_UNINSTALL_FAILED',
          message: errorMessage,
          raw: error
        })
      ]);
    } finally {
      setIsUninstallRequestPending(false);
      endMutation('runtime_uninstall');
    }
  }

  return {
    refreshState,
    handleStartRuntime,
    handleInstallRuntime,
    handleGrantControl,
    handleReleaseControl,
    handleSaveModelConfig,
    handleAgentProfileChange,
    handleUninstallRuntime
  };
}

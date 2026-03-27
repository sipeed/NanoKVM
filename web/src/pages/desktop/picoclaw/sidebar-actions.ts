import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';

import {
  closeGateway,
  connectGateway,
  getPicoclawConfig,
  getRuntimeStatus,
  installRuntime,
  picoclawGateway,
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
import type {
  PicoclawChatMessage,
  PicoclawConfigState,
  PicoclawOverlayState,
  PicoclawRunState,
  PicoclawRuntimeStatus,
  PicoclawTakeoverState,
  PicoclawTransportState
} from '@/jotai/picoclaw.ts';

import { createErrorMessage, createStatusMessage, HIDDEN_OVERLAY } from './message-utils.ts';

type RuntimeStatusSetter = Dispatch<SetStateAction<PicoclawRuntimeStatus | null>>;
type MessageSetter = Dispatch<SetStateAction<PicoclawChatMessage[]>>;
type TakeoverSetter = Dispatch<SetStateAction<PicoclawTakeoverState>>;

type PicoclawSidebarActionOptions = {
  t: TFunction;
  runtimeStatus: PicoclawRuntimeStatus | null;
  transportState: PicoclawTransportState;
  installSnapshot: PicoclawRuntimeInstallSnapshot | null;
  modelApiBase: string;
  modelApiKey: string;
  modelIdentifier: string;
  setConfig: Dispatch<SetStateAction<PicoclawConfigState>>;
  setRuntimeStatus: RuntimeStatusSetter;
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
  setModelApiKey: Dispatch<SetStateAction<string>>;
  setIsSwitchingAgent: Dispatch<SetStateAction<boolean>>;
  setIsUninstallRequestPending: Dispatch<SetStateAction<boolean>>;
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
    setConfig,
    setRuntimeStatus,
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
    setModelApiKey,
    setIsSwitchingAgent,
    setIsUninstallRequestPending
  } = options;

  async function refreshState() {
    const [configRsp, runtimeRsp] = await Promise.allSettled([
      getPicoclawConfig(),
      getRuntimeStatus()
    ]);
    let nextRuntimeStatus = runtimeStatus;

    if (configRsp.status === 'fulfilled' && configRsp.value.code === 0) {
      setConfig((current) => ({
        ...current,
        gatewayUrl: configRsp.value.data.gateway_url || current.gatewayUrl
      }));
    }

    if (runtimeRsp.status === 'fulfilled' && runtimeRsp.value.code === 0) {
      nextRuntimeStatus = runtimeRsp.value.data;
      setRuntimeStatus(runtimeRsp.value.data);
    }

    return nextRuntimeStatus;
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

    if (shouldStop) {
      return status.ready !== true;
    }

    return status.ready === true;
  }

  async function handleStartRuntime() {
    setIsTogglingRuntime(true);

    try {
      const isRuntimeReady = runtimeStatus?.ready === true;
      let response;

      try {
        response = isRuntimeReady ? await stopRuntime() : await startRuntime();
      } catch (error) {
        const latestRuntimeStatus = await refreshState();
        if (
          isUnexpectedEOFError(error) &&
          isExpectedRuntimeState(latestRuntimeStatus ?? null, isRuntimeReady)
        ) {
          setRuntimeStatus(latestRuntimeStatus ?? null);
          setMessages((current) => [
            ...current,
            createStatusMessage(
              t(
                isRuntimeReady ? 'picoclaw.status.runtimeStopped' : 'picoclaw.status.runtimeStarted'
              )
            )
          ]);

          if (isRuntimeReady) {
            closeGateway();
            setTakeover({
              active: false,
              sessionId: picoclawGateway.getSessionId(),
              reason: 'runtime_stopped'
            });
            setOverlay(HIDDEN_OVERLAY);
            setTransportState('disconnected');
            setRunState('idle');
          } else if (transportState !== 'connected') {
            try {
              await connectGateway();
            } catch {
              // handled by gateway events
            }
          }

          return;
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : t(
                isRuntimeReady
                  ? 'picoclaw.status.runtimeStopFailed'
                  : 'picoclaw.status.runtimeStartFailed'
              );
        setMessages((current) => [
          ...current,
          createErrorMessage({
            code: isRuntimeReady ? 'RUNTIME_STOP_FAILED' : 'RUNTIME_START_FAILED',
            message: errorMessage,
            raw: error
          })
        ]);
        return;
      }

      if (response.code === 0) {
        setRuntimeStatus(response.data.status);
        setMessages((current) => [
          ...current,
          createStatusMessage(
            t(isRuntimeReady ? 'picoclaw.status.runtimeStopped' : 'picoclaw.status.runtimeStarted')
          )
        ]);

        if (isRuntimeReady) {
          closeGateway();
          setTakeover({
            active: false,
            sessionId: picoclawGateway.getSessionId(),
            reason: 'runtime_stopped'
          });
          setOverlay(HIDDEN_OVERLAY);
          setTransportState('disconnected');
          setRunState('idle');
        } else if (transportState !== 'connected') {
          try {
            await connectGateway();
          } catch {
            // handled by gateway events
          }
        }
      } else {
        const errorMessage =
          (response as { message?: string; msg?: string }).message ||
          (response as { message?: string; msg?: string }).msg ||
          t(
            isRuntimeReady
              ? 'picoclaw.status.runtimeStopFailed'
              : 'picoclaw.status.runtimeStartFailed'
          );
        setMessages((current) => [
          ...current,
          createErrorMessage({
            code: isRuntimeReady ? 'RUNTIME_STOP_FAILED' : 'RUNTIME_START_FAILED',
            message: errorMessage,
            raw: response
          })
        ]);
      }

      await refreshState();
    } finally {
      setIsTogglingRuntime(false);
    }
  }

  async function handleInstallRuntime() {
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
        setRuntimeStatus(response.data.status);
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
        await refreshState();
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

    setIsSavingModelConfig(true);
    try {
      const response = await setPicoclawModelConfig({
        model,
        api_base: apiBase,
        api_key: apiKey
      });
      if (response.code === 0) {
        setRuntimeStatus(response.data.status);
        setModelApiKey('');
        setIsModelConfigOpen(false);
        setMessages((current) => [...current, createStatusMessage(t('picoclaw.model.saved'))]);
        await refreshState();
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
    }
  }

  async function handleAgentProfileChange(profile: string) {
    if (!profile || profile === runtimeStatus?.agent_profile) {
      return;
    }

    setIsSwitchingAgent(true);
    try {
      const response = await setPicoclawAgentProfile({ profile });
      if (response.code === 0) {
        setRuntimeStatus(response.data.status);
        setMessages((current) => [...current, createStatusMessage(t('picoclaw.agent.switched'))]);
        await refreshState();

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
    }
  }

  async function handleUninstallRuntime() {
    setIsUninstallRequestPending(true);
    setMessages((current) => [...current, createStatusMessage(t('picoclaw.install.uninstalling'))]);

    try {
      const response = await uninstallRuntime();
      if (response.code === 0) {
        setRuntimeStatus(response.data.status);
        setMessages((current) => [
          ...current,
          createStatusMessage(t('picoclaw.install.uninstalled'))
        ]);
        await refreshState();
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
    }
  }

  return {
    refreshState,
    handleStartRuntime,
    handleInstallRuntime,
    handleSaveModelConfig,
    handleAgentProfileChange,
    handleUninstallRuntime
  };
}

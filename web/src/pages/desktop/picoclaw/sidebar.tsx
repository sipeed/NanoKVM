import { Button, message, Modal } from 'antd';
import { useSetAtom } from 'jotai';
import {
  Loader2Icon,
  PlayIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  WifiOffIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { closeGateway } from '@/api/picoclaw.ts';
import { picoclawChatOpenAtom } from '@/jotai/picoclaw.ts';

import { MessageInput } from './message-input.tsx';
import { MessageList } from './message-list.tsx';
import { canConnectGateway, derivePicoclawControlViewModel } from './runtime-view.ts';
import { SidebarHeader } from './sidebar-header.tsx';
import { SidebarHistory } from './sidebar-history.tsx';
import { SidebarInstall } from './sidebar-install.tsx';
import { SidebarModelConfig } from './sidebar-model-config.tsx';
import { useSidebar } from './use-sidebar.ts';

export const Sidebar = () => {
  const { t } = useTranslation();
  const [modal, contextHolder] = Modal.useModal();
  const setIsChatOpen = useSetAtom(picoclawChatOpenAtom);
  const {
    connectionLabel,
    isInitializing,
    sidebarMode,
    handleCancelModelConfig,
    handleAgentProfileChange,
    handleCloseHistory,
    handleDeleteHistorySession,
    handleModelApiBaseChange,
    handleModelApiKeyChange,
    handleModelIdentifierChange,
    handleNewConversation,
    handleOpenHistory,
    handleOpenModelConfig,
    handleReconnectGateway,
    handleSaveModelConfig,
    handleSelectHistorySession,
    historySessions,
    aiControlStatus,
    activeSessionId,
    isDeletingSession,
    isFreshConversation,
    isHistoryOpen,
    isInstallingRuntime,
    isLoadingHistory,
    isSwitchingSession,
    installProgress,
    installStage,
    isSavingModelConfig,
    isSwitchingAgent,
    isControlMutationPending,
    isRuntimeMutationPending,
    isSidebarMutationPending,
    isReleasingControl,
    modelApiBase,
    modelApiKey,
    modelIdentifier,
    isModelConfigOpen,
    runState,
    transportState,
    isTogglingRuntime,
    messages,
    runtimeStatus,
    handleInstallRuntime,
    isUninstallingRuntime,
    handleUninstallRuntime,
    handleSend,
    handleGrantControl,
    handleReleaseControl,
    handleStartRuntime,
    refreshRuntimeState
  } = useSidebar();
  const runtimeError = runtimeStatus?.last_error || runtimeStatus?.config_error;
  const controlView = derivePicoclawControlViewModel({
    aiControlStatus,
    runtimeStatus,
    isReleasingControl,
    t
  });
  const isRuntimeLifecyclePending =
    runtimeStatus?.restoring === true ||
    runtimeStatus?.status === 'starting' ||
    runtimeStatus?.status === 'restoring' ||
    runtimeStatus?.status === 'stopping';
  const controlActionPending = controlView.isActionPending || isControlMutationPending;
  const actionBusy =
    isSidebarMutationPending || controlView.isTransitioning || isRuntimeLifecyclePending;
  const canUseGateway = canConnectGateway(runtimeStatus);
  const isGatewayConnected = canUseGateway && transportState === 'connected';
  const isGatewayConnecting = canUseGateway && transportState === 'connecting';
  const runtimeActionDisabled =
    actionBusy ||
    isSavingModelConfig ||
    isSwitchingAgent ||
    isUninstallingRuntime ||
    isInstallingRuntime;
  const controlIconClass =
    controlView.severity === 'success'
      ? 'text-emerald-400'
      : controlView.severity === 'warning'
        ? 'text-amber-400'
        : controlView.severity === 'info'
          ? 'text-sky-400'
          : 'text-neutral-400';
  const runtimeStartButtonLabel =
    controlView.mode === 'mcp'
      ? t('picoclaw.start.switchFromMCP')
      : controlView.mode === 'off'
        ? t('picoclaw.start.takeoverAndStart')
        : t('picoclaw.config.startRuntime');

  async function startRuntimeWithControl(latestRuntimeStatus: typeof runtimeStatus) {
    if (runtimeActionDisabled) {
      return;
    }

    const latestControlMode =
      latestRuntimeStatus?.control?.mode ?? latestRuntimeStatus?.control_mode ?? controlView.mode;
    if (latestControlMode !== 'picoclaw') {
      const granted = await handleGrantControl();
      if (!granted) {
        return;
      }
    }

    await handleStartRuntime();
  }

  const handleToggleRuntime = async () => {
    if (runtimeActionDisabled) {
      return;
    }
    if (runtimeStatus?.ready) {
      return handleStartRuntime();
    }
    const latestRuntimeStatus = await refreshRuntimeState({ force: true });
    const effectiveRuntimeStatus = latestRuntimeStatus ?? runtimeStatus;
    if (!effectiveRuntimeStatus) {
      message.error(t('picoclaw.status.runtimeStartFailed'));
      return;
    }
    if (effectiveRuntimeStatus.ready) return;

    const latestControlMode =
      effectiveRuntimeStatus.control?.mode ??
      effectiveRuntimeStatus.control_mode ??
      controlView.mode;
    if (latestControlMode === 'mcp') {
      modal.confirm({
        title: t('picoclaw.start.enableConfirmTitle'),
        content: t('picoclaw.start.enableConfirmDesc'),
        okText: t('picoclaw.start.enableConfirmOk'),
        cancelText: t('picoclaw.start.enableConfirmCancel'),
        onOk: () => startRuntimeWithControl(effectiveRuntimeStatus)
      });
      return;
    }

    return startRuntimeWithControl(effectiveRuntimeStatus);
  };

  const handleToggleControl = async () => {
    if (
      isRuntimeMutationPending ||
      isSavingModelConfig ||
      isSwitchingAgent ||
      isUninstallingRuntime
    ) {
      return;
    }
    if (controlView.primaryAction === 'release') {
      await handleReleaseControl();
      return;
    }
    if (controlView.primaryAction !== 'grant') {
      return;
    }
    if (controlView.mode !== 'mcp') {
      await handleGrantControl();
      return;
    }
    modal.confirm({
      title: t('picoclaw.control.grantConfirmTitle', {
        defaultValue: 'Switch device control to PicoClaw?'
      }),
      content: t('picoclaw.control.grantConfirmDesc', {
        defaultValue: 'External MCP device writes will be interrupted.'
      }),
      okText: t('picoclaw.control.grant', { defaultValue: 'Grant control' }),
      cancelText: t('picoclaw.start.enableConfirmCancel'),
      onOk: handleGrantControl
    });
  };

  const handleCloseSidebar = () => {
    void closeGateway();
    setIsChatOpen(false);
  };

  const runtimeHasStarted = runtimeStatus?.ready === true || runtimeStatus?.status === 'ready';
  const shouldShowControlStatusBar =
    (runtimeHasStarted || isReleasingControl) && sidebarMode !== 'loading';

  const controlStatusBar =
    runtimeStatus && shouldShowControlStatusBar ? (
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2.5">
        <div className="min-w-0 text-xs">
          <div className="flex min-w-0 items-center gap-2 text-neutral-300">
            {controlView.isTransitioning ? (
              <Loader2Icon size={14} className={`shrink-0 animate-spin ${controlIconClass}`} />
            ) : controlView.canDeviceWrite ? (
              <ShieldCheckIcon size={14} className={`shrink-0 ${controlIconClass}`} />
            ) : (
              <ShieldOffIcon size={14} className={`shrink-0 ${controlIconClass}`} />
            )}
            <span className="truncate font-medium">{controlView.label}</span>
          </div>
          <div className="mt-0.5 line-clamp-2 max-w-[240px] leading-4 text-neutral-500">
            {controlView.description}
          </div>
        </div>
        {controlView.primaryAction !== 'none' || controlView.isActionPending ? (
          <Button
            size="small"
            type={controlView.canDeviceWrite ? 'default' : 'primary'}
            loading={controlActionPending}
            disabled={
              controlView.isTransitioning ||
              isRuntimeMutationPending ||
              isSavingModelConfig ||
              isSwitchingAgent ||
              isUninstallingRuntime
            }
            onClick={() => void handleToggleControl()}
            className="min-w-[92px] shrink-0"
          >
            {controlView.primaryActionLabel}
          </Button>
        ) : (
          <Button size="small" disabled className="min-w-[92px] shrink-0">
            {controlView.primaryActionLabel}
          </Button>
        )}
      </div>
    ) : null;

  return (
    <aside
      data-picoclaw-sidebar="true"
      className="picoclaw-sidebar-scrollbar flex h-full min-h-0 w-full flex-col overflow-x-hidden bg-[#0d0d0f]"
    >
      {contextHolder}
      {/* Header */}
      <SidebarHeader
        isCheckingRuntime={isInitializing}
        installed={runtimeStatus?.installed}
        modelConfigured={runtimeStatus?.model_configured}
        isTogglingRuntime={isTogglingRuntime}
        actionDisabled={actionBusy}
        runtimeActionDisabled={runtimeActionDisabled}
        agentProfile={runtimeStatus?.agent_profile}
        isSwitchingAgent={isSwitchingAgent}
        runtimeReady={runtimeStatus?.ready}
        runtimeToggleTitle={
          runtimeStatus?.ready ? t('picoclaw.config.stopRuntime') : runtimeStartButtonLabel
        }
        onToggleRuntime={handleToggleRuntime}
        onClose={handleCloseSidebar}
        isHistoryOpen={isHistoryOpen}
        onOpenHistory={isHistoryOpen ? handleCloseHistory : handleOpenHistory}
        onAgentProfileChange={handleAgentProfileChange}
        onOpenModelConfig={handleOpenModelConfig}
        isUninstallingRuntime={isUninstallingRuntime}
        onUninstallRuntime={handleUninstallRuntime}
      />

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />
      {controlStatusBar}

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col">
        {sidebarMode === 'loading' ? (
          <div className="flex flex-1 flex-col items-center pt-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2Icon className="animate-spin text-neutral-500" size={22} />
              <span className="text-xs text-neutral-500">{connectionLabel}</span>
            </div>
          </div>
        ) : sidebarMode === 'install' ? (
          <SidebarInstall
            installProgress={installProgress}
            installStage={installStage}
            disabled={actionBusy}
            isInstalling={isInstallingRuntime}
            onInstall={handleInstallRuntime}
          />
        ) : sidebarMode === 'model' ? (
          <SidebarModelConfig
            apiBase={modelApiBase}
            apiKey={modelApiKey}
            disabled={actionBusy}
            isSaving={isSavingModelConfig}
            modelIdentifier={modelIdentifier}
            modelName={runtimeStatus?.model_name}
            onApiBaseChange={handleModelApiBaseChange}
            onApiKeyChange={handleModelApiKeyChange}
            onModelIdentifierChange={handleModelIdentifierChange}
            onSave={handleSaveModelConfig}
            onCancel={handleCancelModelConfig}
            showCancel={isModelConfigOpen}
          />
        ) : sidebarMode === 'history' ? (
          <SidebarHistory
            sessions={historySessions}
            activeSessionId={activeSessionId}
            isLoading={isLoadingHistory}
            isDeleting={isDeletingSession}
            isSwitching={isSwitchingSession || actionBusy}
            onSelect={handleSelectHistorySession}
            onDelete={handleDeleteHistorySession}
          />
        ) : (
          <>
            {!runtimeStatus?.ready ? (
              <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-10 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                    <PlayIcon className="text-sky-400" size={22} />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-medium text-neutral-200">
                      {runtimeStatus?.restoring
                        ? t('picoclaw.connection.runtime.restoring')
                        : t('picoclaw.start.title')}
                    </h3>
                    <p className="text-xs text-neutral-500">{t('picoclaw.start.description')}</p>
                    {!isInitializing && (
                      <p className="mt-2 text-xs text-neutral-400">{connectionLabel}</p>
                    )}
                    {(runtimeError || runtimeStatus?.runtime_intent?.last_error) && (
                      <p className="mt-2 max-w-[280px] break-words text-xs leading-5 text-red-400">
                        {runtimeError || runtimeStatus?.runtime_intent?.last_error}
                      </p>
                    )}
                  </div>
                  <Button
                    type="primary"
                    icon={<PlayIcon size={14} />}
                    loading={isTogglingRuntime || isRuntimeLifecyclePending}
                    disabled={runtimeActionDisabled}
                    onClick={() => void handleToggleRuntime()}
                  >
                    {runtimeStartButtonLabel}
                  </Button>
                </div>
              </div>
            ) : !canUseGateway ? (
              <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-10 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                    <ShieldOffIcon className="text-amber-400" size={22} />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-medium text-neutral-200">{connectionLabel}</h3>
                    <p className="max-w-[280px] text-xs leading-5 text-neutral-500">
                      {controlView.mode === 'mcp'
                        ? t('picoclaw.connection.runtime.readyBlockedByMCP', {
                            defaultValue:
                              'The runtime is running, but external MCP currently controls device input.'
                          })
                        : t('picoclaw.connection.runtime.readyWithoutControl', {
                            defaultValue:
                              'The runtime is running. Grant PicoClaw device control before reconnecting.'
                          })}
                    </p>
                  </div>
                </div>
              </div>
            ) : !isGatewayConnected ? (
              <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-10 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                    {isGatewayConnecting ? (
                      <Loader2Icon className="animate-spin text-sky-400" size={22} />
                    ) : (
                      <WifiOffIcon className="text-amber-400" size={22} />
                    )}
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-medium text-neutral-200">{connectionLabel}</h3>
                    <p className="text-xs text-neutral-500">
                      {t('picoclaw.connection.transport.reconnectDescription')}
                    </p>
                  </div>
                  <Button
                    type="primary"
                    icon={<RefreshCwIcon size={14} />}
                    loading={isGatewayConnecting}
                    disabled={isGatewayConnecting || actionBusy}
                    onClick={() => void handleReconnectGateway()}
                  >
                    {t('picoclaw.connection.transport.reconnect')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <MessageList messages={messages} runState={runState} />
                <div className="border-t border-white/[0.06] px-3 pb-3 pt-3">
                  <MessageInput
                    transportState={transportState}
                    disabled={actionBusy}
                    onSend={handleSend}
                    onNewConversation={handleNewConversation}
                    disableNewConversation={isFreshConversation || actionBusy}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

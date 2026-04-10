import { Button } from 'antd';
import { useSetAtom } from 'jotai';
import { Loader2Icon, PlayIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { picoclawChatOpenAtom } from '@/jotai/picoclaw.ts';

import { MessageInput } from './message-input.tsx';
import { MessageList } from './message-list.tsx';
import { SidebarHeader } from './sidebar-header.tsx';
import { SidebarHistory } from './sidebar-history.tsx';
import { SidebarInstall } from './sidebar-install.tsx';
import { SidebarModelConfig } from './sidebar-model-config.tsx';
import { useSidebar } from './use-sidebar.ts';

export const Sidebar = () => {
  const { t } = useTranslation();
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
    handleSaveModelConfig,
    handleSelectHistorySession,
    historySessions,
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
    handleStartRuntime
  } = useSidebar();

  return (
    <aside className="picoclaw-sidebar-scrollbar flex h-full min-h-0 w-full flex-col overflow-x-hidden bg-[#0d0d0f]">
      {/* Header */}
      <SidebarHeader
        isCheckingRuntime={isInitializing}
        installed={runtimeStatus?.installed}
        modelConfigured={runtimeStatus?.model_configured}
        isTogglingRuntime={isTogglingRuntime}
        agentProfile={runtimeStatus?.agent_profile}
        isSwitchingAgent={isSwitchingAgent}
        runtimeReady={runtimeStatus?.ready}
        onToggleRuntime={handleStartRuntime}
        onClose={() => setIsChatOpen(false)}
        isHistoryOpen={isHistoryOpen}
        onOpenHistory={isHistoryOpen ? handleCloseHistory : handleOpenHistory}
        onAgentProfileChange={handleAgentProfileChange}
        onOpenModelConfig={handleOpenModelConfig}
        isUninstallingRuntime={isUninstallingRuntime}
        onUninstallRuntime={handleUninstallRuntime}
      />

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

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
            isInstalling={isInstallingRuntime}
            onInstall={handleInstallRuntime}
          />
        ) : sidebarMode === 'model' ? (
          <SidebarModelConfig
            apiBase={modelApiBase}
            apiKey={modelApiKey}
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
            isSwitching={isSwitchingSession}
            onSelect={handleSelectHistorySession}
            onDelete={handleDeleteHistorySession}
          />
        ) : !runtimeStatus?.ready ? (
          <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-10 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                <PlayIcon className="text-sky-400" size={22} />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-medium text-neutral-200">
                  {t('picoclaw.start.title')}
                </h3>
                <p className="text-xs text-neutral-500">{t('picoclaw.start.description')}</p>
              </div>
              <Button
                type="primary"
                icon={<PlayIcon size={14} />}
                loading={isTogglingRuntime}
                onClick={() => void handleStartRuntime()}
              >
                {t('picoclaw.config.startRuntime')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} runState={runState} />
            <div className="border-t border-white/[0.06] px-3 pb-3 pt-3">
              <MessageInput
                transportState={transportState}
                onSend={handleSend}
                onNewConversation={handleNewConversation}
                disableNewConversation={isFreshConversation}
              />
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

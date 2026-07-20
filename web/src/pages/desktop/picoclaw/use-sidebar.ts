import { useMemo, useRef, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import type { PicoclawSessionListItem } from '@/api/picoclaw.ts';
import {
  getPicoclawRuntimeInstallSnapshot,
  type PicoclawRuntimeInstallSnapshot
} from '@/lib/picoclaw-storage.ts';
import { aiControlStatusAtom } from '@/jotai/ai-control.ts';
import { keyboardLockAtom } from '@/jotai/keyboard.ts';
import {
  picoclawConfigAtom,
  picoclawMessagesAtom,
  picoclawOverlayAtom,
  picoclawRunStateAtom,
  picoclawRuntimeStatusAtom,
  picoclawTakeoverStateAtom,
  picoclawTransportStateAtom
} from '@/jotai/picoclaw.ts';

import {
  getPicoclawSidebarConnectionLabel,
  getPicoclawSidebarMode,
  getPicoclawSidebarStatusColor,
  isPicoclawRuntimeInstalling
} from './runtime-view.ts';
import {
  createPicoclawSidebarActions,
  type PicoclawMutation
} from './sidebar-actions.ts';
import {
  usePicoclawGatewayAutoConnect,
  usePicoclawGatewayEvents,
  usePicoclawInstallRefresh,
  usePicoclawInstallSnapshotSync,
  usePicoclawSidebarLifecycle,
  usePicoclawStatusRefresh
} from './sidebar-effects.ts';
import { createPicoclawSidebarSessionActions } from './sidebar-session-actions.ts';

export const useSidebar = () => {
  const { t } = useTranslation();

  const [messages, setMessages] = useAtom(picoclawMessagesAtom);
  const [transportState, setTransportState] = useAtom(picoclawTransportStateAtom);
  const [runState, setRunState] = useAtom(picoclawRunStateAtom);
  const [runtimeStatus, setRuntimeStatus] = useAtom(picoclawRuntimeStatusAtom);
  const [aiControlStatus, setAIControlStatus] = useAtom(aiControlStatusAtom);
  const [config] = useAtom(picoclawConfigAtom);
  const [, setTakeover] = useAtom(picoclawTakeoverStateAtom);
  const setOverlay = useSetAtom(picoclawOverlayAtom);
  const setKeyboardLock = useSetAtom(keyboardLockAtom);
  const previousInstallStateRef = useRef<{ installing: boolean; status: string }>({
    installing: false,
    status: ''
  });

  const [modelApiBase, setModelApiBase] = useState('');
  const [modelApiKey, setModelApiKey] = useState('');
  const [modelIdentifier, setModelIdentifier] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isModelConfigOpen, setIsModelConfigOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInstallRequestPending, setIsInstallRequestPending] = useState(false);
  const [isUninstallRequestPending, setIsUninstallRequestPending] = useState(false);
  const [isSavingModelConfig, setIsSavingModelConfig] = useState(false);
  const [isSwitchingAgent, setIsSwitchingAgent] = useState(false);
  const [isSwitchingSession, setIsSwitchingSession] = useState(false);
  const [isTogglingRuntime, setIsTogglingRuntime] = useState(false);
  const isTogglingRuntimeRef = useRef(false);
  const [isReleasingControl, setIsReleasingControl] = useState(false);
  const [picoclawMutation, setPicoclawMutation] = useState<PicoclawMutation>('none');
  const mutationRef = useRef<PicoclawMutation>('none');
  const mutationEpochRef = useRef(0);
  const refreshRequestSeqRef = useRef(0);
  const [isFreshConversation, setIsFreshConversation] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [historySessions, setHistorySessions] = useState<PicoclawSessionListItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [installSnapshot, setInstallSnapshot] = useState<PicoclawRuntimeInstallSnapshot | null>(
    () => getPicoclawRuntimeInstallSnapshot()
  );
  const refreshStatePromiseRef = useRef<Promise<NonNullable<typeof runtimeStatus> | null> | null>(
    null
  );
  const isRuntimeMutationPending =
    picoclawMutation === 'runtime_start' ||
    picoclawMutation === 'runtime_stop' ||
    picoclawMutation === 'runtime_install' ||
    picoclawMutation === 'runtime_uninstall';
  const isControlMutationPending =
    picoclawMutation === 'control_grant' || picoclawMutation === 'control_release';
  const isSidebarMutationPending = picoclawMutation !== 'none';
  const isRuntimeStatusInstalling = isPicoclawRuntimeInstalling(runtimeStatus);
  const isSnapshotInstalling = !runtimeStatus && installSnapshot?.installing === true;
  const isRuntimeInstallActive = isRuntimeStatusInstalling || isSnapshotInstalling;
  const isInstallingRuntime = isInstallRequestPending || isRuntimeInstallActive;
  const installProgress = isRuntimeStatusInstalling
    ? (runtimeStatus?.install_progress ?? installSnapshot?.installProgress)
    : isSnapshotInstalling
      ? installSnapshot?.installProgress
      : undefined;
  const installStage = isRuntimeStatusInstalling
    ? (runtimeStatus?.install_stage ?? installSnapshot?.installStage)
    : isSnapshotInstalling
      ? installSnapshot?.installStage
      : undefined;
  const actions = createPicoclawSidebarActions({
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
  });
  const refreshStateRef = useRef(actions.refreshState);
  refreshStateRef.current = actions.refreshState;
  isTogglingRuntimeRef.current = isTogglingRuntime;
  const sessionActions = createPicoclawSidebarSessionActions({
    t,
    transportState,
    runState,
    config,
    activeSessionId,
    isFreshConversation,
    isSidebarMutationPending,
    isSwitchingSession,
    refreshState: refreshStateRef.current,
    setMessages,
    setTakeover,
    setOverlay,
    setTransportState,
    setRunState,
    setHistorySessions,
    setActiveSessionId,
    setIsFreshConversation,
    setIsHistoryOpen,
    setIsModelConfigOpen,
    setIsLoadingHistory,
    setIsDeletingSession,
    setIsSwitchingSession,
    setRuntimeStatus
  });

  usePicoclawGatewayEvents({
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
  });
  usePicoclawSidebarLifecycle({
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
  });
  usePicoclawInstallRefresh(isRuntimeInstallActive, refreshStateRef);
  usePicoclawGatewayAutoConnect({
    activeSessionId,
    runtimeStatus,
    transportState,
    disabled: isSidebarMutationPending
  });
  usePicoclawStatusRefresh(isRuntimeInstallActive || isSidebarMutationPending, refreshStateRef);
  usePicoclawInstallSnapshotSync({
    t,
    runtimeStatus,
    setInstallSnapshot,
    previousInstallStateRef,
    setMessages
  });

  const connectionLabel = useMemo(
    () =>
      getPicoclawSidebarConnectionLabel(runtimeStatus, transportState, runState, isInitializing, t),
    [isInitializing, runState, runtimeStatus, t, transportState]
  );
  const statusColor = useMemo(
    () => getPicoclawSidebarStatusColor(runtimeStatus, transportState, runState, isInitializing),
    [isInitializing, runState, runtimeStatus, transportState]
  );
  const sidebarMode = useMemo(() => {
    if (isModelConfigOpen) {
      return 'model';
    }
    if (isHistoryOpen) {
      return 'history';
    }
    return getPicoclawSidebarMode(runtimeStatus, isInitializing);
  }, [isHistoryOpen, isInitializing, isModelConfigOpen, runtimeStatus]);

  return {
    activeSessionId,
    aiControlStatus,
    connectionLabel,
    handleCancelModelConfig: () => setIsModelConfigOpen(false),
    handleAgentProfileChange: actions.handleAgentProfileChange,
    handleCloseHistory: sessionActions.handleCloseHistory,
    handleDeleteHistorySession: sessionActions.handleDeleteHistorySession,
    handleModelApiBaseChange: setModelApiBase,
    handleModelApiKeyChange: setModelApiKey,
    handleModelIdentifierChange: setModelIdentifier,
    handleNewConversation: sessionActions.handleNewConversation,
    handleReconnectGateway: sessionActions.handleReconnectGateway,
    handleOpenHistory: sessionActions.handleOpenHistory,
    handleOpenModelConfig: () => {
      setIsHistoryOpen(false);
      setIsModelConfigOpen(true);
    },
    handleSaveModelConfig: actions.handleSaveModelConfig,
    handleSelectHistorySession: sessionActions.handleSelectHistorySession,
    historySessions,
    isDeletingSession,
    isFreshConversation,
    isHistoryOpen,
    isInitializing,
    isInstallingRuntime,
    isLoadingHistory,
    isSwitchingSession,
    isUninstallingRuntime: isUninstallRequestPending,
    installProgress,
    installStage,
    isSavingModelConfig,
    isSwitchingAgent,
    isControlMutationPending,
    isRuntimeMutationPending,
    isSidebarMutationPending,
    isTogglingRuntime,
    isReleasingControl,
    messages,
    modelApiBase,
    modelApiKey,
    modelIdentifier,
    isModelConfigOpen,
    runState,
    runtimeStatus,
    picoclawMutation,
    sidebarMode,
    statusColor,
    handleGrantControl: actions.handleGrantControl,
    handleInstallRuntime: actions.handleInstallRuntime,
    handleReleaseControl: actions.handleReleaseControl,
    handleUninstallRuntime: actions.handleUninstallRuntime,
    transportState,
    handleSend: sessionActions.handleSend,
    handleStartRuntime: actions.handleStartRuntime,
    refreshRuntimeState: actions.refreshState,
    handleStop: sessionActions.handleStop
  };
};

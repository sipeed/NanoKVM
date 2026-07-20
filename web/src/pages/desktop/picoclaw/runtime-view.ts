import type { TFunction } from 'i18next';

import type { AIControlMode, AIControlStatus } from '@/jotai/ai-control.ts';
import type {
  PicoclawRunState,
  PicoclawRuntimeStatus,
  PicoclawTransportState
} from '@/jotai/picoclaw.ts';

export type PicoclawSidebarMode = 'loading' | 'install' | 'model' | 'chat';

export type PicoclawControlPrimaryAction = 'grant' | 'release' | 'none';

export type PicoclawControlViewModel = {
  mode: AIControlMode;
  label: string;
  description: string;
  canDeviceWrite: boolean;
  isTransitioning: boolean;
  isActionPending: boolean;
  primaryAction: PicoclawControlPrimaryAction;
  primaryActionLabel: string;
  severity: 'success' | 'warning' | 'neutral' | 'info';
};

type PicoclawControlViewModelOptions = {
  aiControlStatus: AIControlStatus | null;
  runtimeStatus: PicoclawRuntimeStatus | null;
  isReleasingControl: boolean;
  t: TFunction;
};

export function isPicoclawRuntimeInstalling(
  runtimeStatus: PicoclawRuntimeStatus | null | undefined
) {
  return runtimeStatus?.installing === true || runtimeStatus?.status === 'installing';
}

export function getPicoclawSidebarMode(
  runtimeStatus: PicoclawRuntimeStatus | null,
  isInitializing: boolean
): PicoclawSidebarMode {
  if (isInitializing || !runtimeStatus) {
    return 'loading';
  }
  if (runtimeStatus?.installed === false) {
    return 'install';
  }
  if (runtimeStatus?.model_configured === false) {
    return 'model';
  }
  return 'chat';
}

export function canConnectGateway(runtimeStatus: PicoclawRuntimeStatus | null) {
  if (!runtimeStatus) {
    return false;
  }

  if (isPicoclawRuntimeInstalling(runtimeStatus) || runtimeStatus.restoring === true) {
    return false;
  }

  if (runtimeStatus.installed === false || runtimeStatus.model_configured === false) {
    return false;
  }

  if (runtimeStatus.transitioning === true || runtimeStatus.control?.transitioning === true) {
    return false;
  }

  const canChat =
    runtimeStatus.capabilities?.chat ??
    (runtimeStatus.ready === true && runtimeStatus.control_mode !== 'mcp');

  return runtimeStatus.ready === true && canChat;
}

export function getPicoclawSidebarStatusColor(
  runtimeStatus: PicoclawRuntimeStatus | null,
  transportState: PicoclawTransportState,
  runState: PicoclawRunState,
  isInitializing: boolean
) {
  if (isInitializing || !runtimeStatus) {
    return '#38bdf8';
  }

  if (
    isPicoclawRuntimeInstalling(runtimeStatus) ||
    runtimeStatus.restoring === true ||
    transportState === 'connecting'
  ) {
    return '#38bdf8';
  }

  if (runtimeStatus.installed === false || runtimeStatus.model_configured === false) {
    return '#f59e0b';
  }

  if (runtimeStatus.ready !== true || transportState === 'error') {
    return '#ef4444';
  }

  if (transportState === 'disconnected') {
    return '#f59e0b';
  }

  if (transportState === 'connected' && runState === 'busy') {
    return '#38bdf8';
  }

  return '#22c55e';
}

export function getPicoclawSidebarConnectionLabel(
  runtimeStatus: PicoclawRuntimeStatus | null,
  transportState: PicoclawTransportState,
  runState: PicoclawRunState,
  isInitializing: boolean,
  t: TFunction
) {
  if (isInitializing || !runtimeStatus) {
    return t('picoclaw.connection.runtime.checking');
  }

  if (isPicoclawRuntimeInstalling(runtimeStatus)) {
    return t('picoclaw.install.installing');
  }

  if (runtimeStatus.installed === false) {
    return t('picoclaw.install.requiredTitle');
  }

  if (runtimeStatus.model_configured === false) {
    return t('picoclaw.model.requiredTitle');
  }

  if (runtimeStatus.ready !== true) {
    switch (runtimeStatus.status) {
      case 'restoring':
        return t('picoclaw.connection.runtime.restoring');
      case 'checking':
        return t('picoclaw.connection.runtime.checking');
      case 'blocked_by_mcp':
        return t('picoclaw.connection.runtime.blockedByMCP');
      case 'config_error':
        return t('picoclaw.connection.runtime.configError');
      case 'unavailable':
        return t('picoclaw.connection.runtime.unavailable');
      case 'stopped':
      case 'installed':
      case 'ready':
      default:
        return t('picoclaw.connection.runtime.stopped');
    }
  }

  const controlMode = runtimeStatus.control?.mode ?? runtimeStatus.control_mode;
  const canControl =
    runtimeStatus.control?.can_control ??
    (runtimeStatus.control_mode === 'picoclaw' && runtimeStatus.transitioning !== true);
  if (controlMode === 'mcp' && !canControl) {
    return t('picoclaw.connection.runtime.blockedByMCP');
  }
  if (controlMode === 'off' && !canControl) {
    return t('picoclaw.control.off');
  }

  if (transportState === 'connected') {
    return `${t('picoclaw.connection.transport.connected')} · ${t(`picoclaw.connection.run.${runState}`)}`;
  }

  if (transportState === 'connecting') {
    return t('picoclaw.connection.transport.connecting');
  }

  if (transportState === 'error') {
    return t('picoclaw.connection.runtime.unavailable');
  }

  if (transportState === 'disconnected') {
    return t('picoclaw.connection.transport.disconnected');
  }

  return t('picoclaw.connection.runtime.ready');
}

export function derivePicoclawControlViewModel({
  aiControlStatus,
  runtimeStatus,
  isReleasingControl,
  t
}: PicoclawControlViewModelOptions): PicoclawControlViewModel {
  const mode =
    runtimeStatus?.control?.mode ?? runtimeStatus?.control_mode ?? aiControlStatus?.mode ?? 'off';
  const backendTransitioning =
    runtimeStatus?.control?.transitioning ??
    runtimeStatus?.transitioning ??
    aiControlStatus?.transitioning ??
    false;
  const isTransitioning = isReleasingControl || backendTransitioning;
  const runtimeCanDeviceWrite = runtimeStatus
    ? runtimeStatus.control?.can_control ??
      (runtimeStatus.control_mode === 'picoclaw' && runtimeStatus.transitioning !== true)
    : undefined;
  const canDeviceWrite =
    !isReleasingControl && (runtimeCanDeviceWrite ?? aiControlStatus?.canControlPicoclaw ?? false);
  const primaryAction: PicoclawControlPrimaryAction = isTransitioning
    ? 'none'
    : canDeviceWrite
      ? 'release'
      : 'grant';
  const primaryActionLabel = isReleasingControl
    ? t('picoclaw.control.releasing')
    : backendTransitioning
      ? t('picoclaw.control.switching')
      : canDeviceWrite
        ? t('picoclaw.control.release')
        : t('picoclaw.control.grant');

  if (isReleasingControl) {
    return {
      mode,
      label: t('picoclaw.control.releasingLabel'),
      description: t('picoclaw.control.releasingDescription'),
      canDeviceWrite: false,
      isTransitioning: true,
      isActionPending: true,
      primaryAction,
      primaryActionLabel,
      severity: 'info'
    };
  }

  if (backendTransitioning) {
    return {
      mode,
      label: t('picoclaw.control.transitioning'),
      description: t('picoclaw.control.transitioningDescription'),
      canDeviceWrite: false,
      isTransitioning: true,
      isActionPending: true,
      primaryAction,
      primaryActionLabel,
      severity: 'info'
    };
  }

  if (mode === 'picoclaw') {
    return {
      mode,
      label: t('picoclaw.control.picoclaw'),
      description: t('picoclaw.control.picoclawDescription'),
      canDeviceWrite,
      isTransitioning: false,
      isActionPending: false,
      primaryAction,
      primaryActionLabel,
      severity: 'success'
    };
  }

  if (mode === 'mcp') {
    return {
      mode,
      label: t('picoclaw.control.mcp'),
      description: t('picoclaw.control.mcpDescription'),
      canDeviceWrite: false,
      isTransitioning: false,
      isActionPending: false,
      primaryAction,
      primaryActionLabel,
      severity: 'warning'
    };
  }

  return {
    mode,
    label: t('picoclaw.control.off'),
    description: t('picoclaw.control.offDescription'),
    canDeviceWrite: false,
    isTransitioning: false,
    isActionPending: false,
    primaryAction,
    primaryActionLabel,
    severity: 'neutral'
  };
}

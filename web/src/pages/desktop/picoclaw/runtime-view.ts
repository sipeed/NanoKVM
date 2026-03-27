import type { TFunction } from 'i18next';

import type {
  PicoclawRunState,
  PicoclawRuntimeStatus,
  PicoclawTransportState
} from '@/jotai/picoclaw.ts';

export type PicoclawSidebarMode = 'loading' | 'install' | 'model' | 'chat';

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

  if (runtimeStatus.installing) {
    return false;
  }

  if (runtimeStatus.installed === false || runtimeStatus.model_configured === false) {
    return false;
  }

  return runtimeStatus.ready === true;
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

  if (runtimeStatus.installing || transportState === 'connecting') {
    return '#38bdf8';
  }

  if (runtimeStatus.installed === false || runtimeStatus.model_configured === false) {
    return '#f59e0b';
  }

  if (runtimeStatus.ready !== true || transportState === 'error') {
    return '#ef4444';
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

  if (runtimeStatus.installing) {
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
      case 'checking':
        return t('picoclaw.connection.runtime.checking');
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

  if (transportState === 'connected') {
    return `${t('picoclaw.connection.transport.connected')} · ${t(`picoclaw.connection.run.${runState}`)}`;
  }

  if (transportState === 'connecting') {
    return t('picoclaw.connection.transport.connecting');
  }

  if (transportState === 'error') {
    return t('picoclaw.connection.runtime.unavailable');
  }

  return t('picoclaw.connection.runtime.ready');
}

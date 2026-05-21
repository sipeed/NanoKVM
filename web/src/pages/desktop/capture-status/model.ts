export const CAPTURE_STATUS_EVENT = 'capture-status';

export type CaptureStatus = {
  ok: boolean;
  result: number;
  message: string;
  mode: string;
  severity: 'error' | 'warning' | '';
  updatedAt: string;
};

export function parseCaptureStatusMessage(message: { data: unknown }): CaptureStatus | null {
  if (typeof message.data !== 'string') {
    return null;
  }

  try {
    const envelope = JSON.parse(message.data) as { data?: unknown };
    if (typeof envelope.data !== 'string') {
      return null;
    }

    const status = JSON.parse(envelope.data) as Partial<CaptureStatus>;
    if (typeof status.ok !== 'boolean' || typeof status.result !== 'number') {
      return null;
    }

    return {
      ok: status.ok,
      result: status.result,
      message: typeof status.message === 'string' ? status.message : '',
      mode: typeof status.mode === 'string' ? status.mode : '',
      severity: status.severity === 'warning' ? 'warning' : status.ok ? '' : 'error',
      updatedAt: typeof status.updatedAt === 'string' ? status.updatedAt : ''
    };
  } catch (error) {
    console.log(error);
    return null;
  }
}

export function getCaptureStatusMessageKey(result: number) {
  switch (result) {
    case -7:
      return 'screen.captureStatus.hdmiError';
    case -6:
      return 'screen.captureStatus.unsupportedResolution';
    case -5:
      return 'screen.captureStatus.retrieving';
    case -4:
      return 'screen.captureStatus.changingResolution';
    case -3:
      return 'screen.captureStatus.updateFailed';
    case -2:
      return 'screen.captureStatus.videoError';
    case -1:
      return 'screen.captureStatus.noHdmi';
    default:
      return result < 0 ? 'screen.captureStatus.unavailable' : '';
  }
}

export function shouldAcceptCaptureStatus(current: CaptureStatus | null, next: CaptureStatus) {
  if (!current) {
    return true;
  }

  return getCaptureStatusTimestamp(next) >= getCaptureStatusTimestamp(current);
}

function getCaptureStatusTimestamp(status: CaptureStatus) {
  const timestamp = Date.parse(status.updatedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

import { useEffect, useRef, useState } from 'react';

import { client } from '@/lib/websocket.ts';

import {
  CAPTURE_STATUS_EVENT,
  CaptureStatus,
  parseCaptureStatusMessage,
  shouldAcceptCaptureStatus
} from './model';

export function useCaptureStatus(activeVideoMode: string) {
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus | null>(null);
  const latestStatusRef = useRef<CaptureStatus | null>(null);

  useEffect(() => {
    latestStatusRef.current = null;
    setCaptureStatus(null);

    if (!activeVideoMode) {
      return;
    }

    return client.on(CAPTURE_STATUS_EVENT, (message) => {
      const status = parseCaptureStatusMessage(message);
      if (!status || status.mode !== activeVideoMode) {
        return;
      }
      if (!shouldAcceptCaptureStatus(latestStatusRef.current, status)) {
        return;
      }

      latestStatusRef.current = status;
      setCaptureStatus(status.ok ? null : status);
    });
  }, [activeVideoMode]);

  return captureStatus;
}

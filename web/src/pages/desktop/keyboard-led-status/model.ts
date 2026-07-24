export const KEYBOARD_LED_STATUS_EVENT = 'hid-led-status';

export type KeyboardLedStatus = {
  numLock: boolean;
  capsLock: boolean;
  scrollLock: boolean;
  known: boolean;
  updatedAt: string;
};

export function parseKeyboardLedStatus(value: unknown): KeyboardLedStatus | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const status = value as Partial<KeyboardLedStatus>;
  if (
    typeof status.numLock !== 'boolean' ||
    typeof status.capsLock !== 'boolean' ||
    typeof status.scrollLock !== 'boolean' ||
    typeof status.known !== 'boolean'
  ) {
    return null;
  }

  return {
    numLock: status.numLock,
    capsLock: status.capsLock,
    scrollLock: status.scrollLock,
    known: status.known,
    updatedAt: typeof status.updatedAt === 'string' ? status.updatedAt : ''
  };
}

export function parseKeyboardLedStatusMessage(message: {
  data: unknown;
}): KeyboardLedStatus | null {
  if (typeof message.data !== 'string') {
    return null;
  }

  try {
    const envelope = JSON.parse(message.data) as { data?: unknown };
    if (typeof envelope.data !== 'string') {
      return null;
    }

    return parseKeyboardLedStatus(JSON.parse(envelope.data));
  } catch (error) {
    console.log(error);
    return null;
  }
}

export function shouldAcceptKeyboardLedStatus(
  current: KeyboardLedStatus | null,
  next: KeyboardLedStatus
) {
  if (!current) {
    return true;
  }

  return getTimestamp(next) >= getTimestamp(current);
}

function getTimestamp(status: KeyboardLedStatus) {
  const timestamp = Date.parse(status.updatedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

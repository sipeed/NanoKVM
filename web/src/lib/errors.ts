type MessageLike = {
  message?: unknown;
  msg?: unknown;
};

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function getResponseErrorMessage(response: unknown, fallback: string) {
  if (response && typeof response === 'object') {
    const { message, msg } = response as MessageLike;
    if (message) {
      return String(message);
    }
    if (msg) {
      return String(msg);
    }
  }

  return fallback;
}

export function isUnexpectedEOFError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('unexpected eof') || message === 'eof';
}

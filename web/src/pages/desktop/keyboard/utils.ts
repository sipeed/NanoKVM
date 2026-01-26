export function normalizeKeyCode(event: KeyboardEvent, os?: string): string {
  if (event.code) {
    return event.code;
  }

  // Fallback: use event.key + event.location to determine the key
  // event.location: 1 = left, 2 = right, 0 = standard (non-positional)
  if (event.key === 'Shift') {
    if (event.location === 0 && os === 'Windows') {
      return 'ShiftRight';
    }
    return event.location === 2 ? 'ShiftRight' : 'ShiftLeft';
  }

  if (event.key === 'Control') {
    return event.location === 2 ? 'ControlRight' : 'ControlLeft';
  }
  if (event.key === 'Alt') {
    return event.location === 2 ? 'AltRight' : 'AltLeft';
  }
  if (event.key === 'Meta') {
    return event.location === 2 ? 'MetaRight' : 'MetaLeft';
  }

  return event.code;
}

export type InputAdapterMode = 'auto' | 'pointer-lock' | 'touchpad';

export type MouseModeValue = 'absolute' | 'relative';

export type PointerCapabilities = {
  hasTouch: boolean;
  coarsePointer: boolean;
  finePointer: boolean;
  canPointerLock: boolean;
};

export function getPointerCapabilities(): PointerCapabilities {
  if (typeof window === 'undefined') {
    return { hasTouch: false, coarsePointer: false, finePointer: false, canPointerLock: false };
  }

  return {
    hasTouch: navigator.maxTouchPoints > 0,
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    finePointer: window.matchMedia?.('(pointer: fine)').matches ?? false,
    canPointerLock: 'requestPointerLock' in HTMLElement.prototype
  };
}

export function normalizeInputAdapterMode(value: string | null | undefined): InputAdapterMode {
  // Keep the original experimental preference compatible with its replacement.
  if (value === 'direct-touch') return 'touchpad';
  if (value === 'auto' || value === 'pointer-lock' || value === 'touchpad') return value;
  return 'auto';
}

export function resolveInputAdapter(
  configuredMode: InputAdapterMode,
  mouseMode: MouseModeValue,
  capabilities: PointerCapabilities = getPointerCapabilities()
): Exclude<InputAdapterMode, 'auto'> {
  if (configuredMode !== 'auto') return configuredMode;

  if (
    (mouseMode === 'absolute' && (capabilities.hasTouch || capabilities.coarsePointer)) ||
    (capabilities.hasTouch && capabilities.coarsePointer && !capabilities.finePointer)
  ) {
    return 'touchpad';
  }

  return capabilities.canPointerLock ? 'pointer-lock' : 'touchpad';
}

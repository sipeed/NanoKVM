export const PICOCLAW_INPUT_KEYBOARD_LOCK_SOURCE = 'picoclaw-input';
export const PICOCLAW_MODEL_CONFIG_KEYBOARD_LOCK_SOURCE = 'picoclaw-model-config';

export function releasePicoclawInputFocus() {
  if (typeof document === 'undefined') {
    return;
  }

  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) {
    return;
  }

  if (activeElement.closest('[data-picoclaw-sidebar="true"]')) {
    activeElement.blur();
  }
}

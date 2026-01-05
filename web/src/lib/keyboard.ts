import { getKeycode, getModifierBit, isModifier } from './keymap';

const MAX_KEYS = 6;

export class KeyboardReport {
  private modifier: number = 0;
  private pressedKeys: Map<string, number> = new Map();

  keyDown(code: string): Uint8Array {
    if (isModifier(code)) {
      this.modifier |= getModifierBit(code);
    } else {
      const keycode = getKeycode(code);
      if (keycode !== undefined && this.pressedKeys.size < MAX_KEYS) {
        this.pressedKeys.set(code, keycode);
      }
    }
    return this.buildReport();
  }

  keyUp(code: string): Uint8Array {
    if (isModifier(code)) {
      this.modifier &= ~getModifierBit(code);
    } else {
      this.pressedKeys.delete(code);
    }
    return this.buildReport();
  }

  reset(): Uint8Array {
    this.modifier = 0;
    this.pressedKeys.clear();
    return this.buildReport();
  }

  /**
   * Build the 8-byte HID keyboard report
   * Byte 0: Modifier keys bitmap
   * Byte 1: Reserved (0x00)
   * Bytes 2-7: Up to 6 keycodes
   */
  private buildReport(): Uint8Array {
    const report = new Uint8Array(8);
    report[0] = this.modifier;
    report[1] = 0x00;

    let i = 2;
    for (const keycode of this.pressedKeys.values()) {
      if (i >= 8) break;
      report[i++] = keycode;
    }

    return report;
  }

  getModifier(): number {
    return this.modifier;
  }

  getPressedKeyCount(): number {
    return this.pressedKeys.size;
  }
}

export const keyboard = new KeyboardReport();

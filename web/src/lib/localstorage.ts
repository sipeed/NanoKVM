import { Resolution } from '@/types';

const LANGUAGE_KEY = 'nano-kvm-language';
const VIDEO_MODE_KEY = 'nano-kvm-vide-mode';
const WEB_RESOLUTION_KEY = 'nano-kvm-web-resolution';
const FPS_KEY = 'nano-kvm-fps';
const QUALITY_KEY = 'nano-kvm-quality';
const GOP_KEY = 'nano-kvm-gop';
const FRAME_DETECT_KEY = 'nano-kvm-frame-detect';
const MOUSE_STYLE_KEY = 'nano-kvm-mouse-style';
const MOUSE_MODE_KEY = 'nano-kvm-mouse-mode';
const MOUSE_SCROLL_INTERVAL_KEY = 'nanokvm-kvm-mouse-scroll-interval';
const SKIP_UPDATE_KEY = 'nano-kvm-check-update';
const KEYBOARD_SYSTEM_KEY = 'nano-kvm-keyboard-system';
const KEYBOARD_LANGUAGE_KEY = 'nano-kvm-keyboard-language';
const SKIP_MODIFY_PASSWORD_KEY = 'nano-kvm-skip-modify-password';
const MENU_DISABLED_ITEMS_KEY = 'nano-kvm-menu-disabled-items';
const POWER_CONFIRM_KEY = 'nano-kvm-power-confirm';
const IS_ADMIN_KEY = 'nano-kvm-is-admin';
const USERNAME_KEY = 'nano-kvm-username';

type ItemWithExpiry = {
  value: string;
  expiry: number;
};

// set the value with expiration time (unit: milliseconds)
function setWithExpiry(key: string, value: string, ttl: number) {
  const now = new Date();

  const item: ItemWithExpiry = {
    value: value,
    expiry: now.getTime() + ttl
  };

  localStorage.setItem(key, JSON.stringify(item));
}

// get the value with expiration time
function getWithExpiry(key: string) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item: ItemWithExpiry = JSON.parse(itemStr);
  const now = new Date();
  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }

  return item.value;
}

export function getLanguage() {
  return localStorage.getItem(LANGUAGE_KEY);
}

export function setLanguage(language: string) {
  localStorage.setItem(LANGUAGE_KEY, language);
}

export function getVideoMode() {
  return localStorage.getItem(VIDEO_MODE_KEY);
}

export function setVideoMode(mode: string) {
  localStorage.setItem(VIDEO_MODE_KEY, mode);
}

export function getResolution(): Resolution | null {
  const resolution = localStorage.getItem(WEB_RESOLUTION_KEY);
  if (resolution) {
    const obj = JSON.parse(window.atob(resolution));
    return obj as Resolution;
  }

  return null;
}

export function setResolution(resolution: Resolution) {
  localStorage.setItem(WEB_RESOLUTION_KEY, window.btoa(JSON.stringify(resolution)));
}

export function getFps() {
  const fps = localStorage.getItem(FPS_KEY);
  return fps ? Number(fps) : null;
}

export function setFps(fps: number) {
  localStorage.setItem(FPS_KEY, String(fps));
}

export function getQuality() {
  const quality = localStorage.getItem(QUALITY_KEY);
  return quality ? Number(quality) : null;
}

export function setQuality(quality: number) {
  localStorage.setItem(QUALITY_KEY, String(quality));
}

export function getGop() {
  const gop = localStorage.getItem(GOP_KEY);
  return gop ? Number(gop) : null;
}

export function setGop(gop: number) {
  localStorage.setItem(GOP_KEY, String(gop));
}

export function getFrameDetect(): boolean {
  const enabled = localStorage.getItem(FRAME_DETECT_KEY);
  return enabled === 'true';
}

export function setFrameDetect(enabled: boolean) {
  localStorage.setItem(FRAME_DETECT_KEY, String(enabled));
}

export function getMouseStyle() {
  return localStorage.getItem(MOUSE_STYLE_KEY);
}

export function setMouseStyle(mouse: string) {
  localStorage.setItem(MOUSE_STYLE_KEY, mouse);
}

export function getMouseMode() {
  return localStorage.getItem(MOUSE_MODE_KEY);
}

export function setMouseMode(mouse: string) {
  localStorage.setItem(MOUSE_MODE_KEY, mouse);
}

export function getMouseScrollInterval() {
  const interval = localStorage.getItem(MOUSE_SCROLL_INTERVAL_KEY);
  return interval ? Number(interval) : null;
}

export function setMouseScrollInterval(interval: number): void {
  localStorage.setItem(MOUSE_SCROLL_INTERVAL_KEY, String(interval));
}

export function getSkipUpdate() {
  const skip = getWithExpiry(SKIP_UPDATE_KEY);
  return skip === 'true';
}

export function setSkipUpdate(skip: boolean) {
  const expiry = 3 * 24 * 60 * 60 * 1000; // 3 days
  setWithExpiry(SKIP_UPDATE_KEY, String(skip), expiry);
}

export function setKeyboardSystem(system: string) {
  localStorage.setItem(KEYBOARD_SYSTEM_KEY, system);
}

export function getKeyboardSystem() {
  return localStorage.getItem(KEYBOARD_SYSTEM_KEY);
}

export function setKeyboardLanguage(language: string) {
  localStorage.setItem(KEYBOARD_LANGUAGE_KEY, language);
}

export function getKeyboardLanguage() {
  return localStorage.getItem(KEYBOARD_LANGUAGE_KEY);
}

export function setSkipModifyPassword(skip: boolean) {
  const expiry = 3 * 24 * 60 * 60 * 1000; // 3 days
  setWithExpiry(SKIP_MODIFY_PASSWORD_KEY, String(skip), expiry);
}

export function getSkipModifyPassword() {
  const skip = getWithExpiry(SKIP_MODIFY_PASSWORD_KEY);
  return skip === 'true';
}

export function setMenuDisabledItems(items: string[]) {
  const value = JSON.stringify(items);
  localStorage.setItem(MENU_DISABLED_ITEMS_KEY, value);
}

export function getMenuDisabledItems(): string[] {
  const value = localStorage.getItem(MENU_DISABLED_ITEMS_KEY);
  return value ? JSON.parse(value) : [];
}

export function getPowerConfirm() {
  const enabled = localStorage.getItem(POWER_CONFIRM_KEY);
  return enabled === 'true';
}

export function setPowerConfirm(enabled: boolean) {
  localStorage.setItem(POWER_CONFIRM_KEY, String(enabled));
}

export function saveIsAdmin(isAdmin: boolean) {
  const value = JSON.stringify(isAdmin);
  localStorage.setItem(IS_ADMIN_KEY, value);
}

export function loadIsAdmin() {
  const value = localStorage.getItem(IS_ADMIN_KEY);
  return value ? JSON.parse(value) : false;
}

export function saveUsername(username: boolean) {
  const value = JSON.stringify(username);
  localStorage.setItem(USERNAME_KEY, value);
}

export function loadUsername() {
  const value = localStorage.getItem(USERNAME_KEY);
  return value ? JSON.parse(value) : "";
}

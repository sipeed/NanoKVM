import type { PicoclawRuntimeInstallSnapshot } from '@/types';

const PICOCLAW_SESSION_ID_KEY = 'nano-kvm-picoclaw-session-id';
const LEGACY_AI_SESSION_ID_KEY = 'nano-kvm-ai-session-id';
const PICOCLAW_MAX_STEPS_KEY = 'nano-kvm-picoclaw-max-steps';
const LEGACY_AI_MAX_STEPS_KEY = 'nano-kvm-ai-max-steps';
const PICOCLAW_MAX_RUNTIME_KEY = 'nano-kvm-picoclaw-max-runtime-ms';
const LEGACY_AI_MAX_RUNTIME_KEY = 'nano-kvm-ai-max-runtime-ms';
const PICOCLAW_RUNTIME_INSTALL_SNAPSHOT_KEY = 'nano-kvm-picoclaw-runtime-install-snapshot';
const LEGACY_AI_RUNTIME_INSTALL_SNAPSHOT_KEY = 'nano-kvm-ai-runtime-install-snapshot';

function getSessionStore() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getLocalValue(primaryKey: string, legacyKey: string) {
  return localStorage.getItem(primaryKey) || localStorage.getItem(legacyKey);
}

function setLocalValue(primaryKey: string, legacyKey: string, value: string) {
  localStorage.setItem(primaryKey, value);
  localStorage.removeItem(legacyKey);
}

function removeLocalValue(primaryKey: string, legacyKey: string) {
  localStorage.removeItem(primaryKey);
  localStorage.removeItem(legacyKey);
}

export function getPicoclawSessionId() {
  const sessionStore = getSessionStore();
  return (
    sessionStore?.getItem(PICOCLAW_SESSION_ID_KEY) ||
    sessionStore?.getItem(LEGACY_AI_SESSION_ID_KEY) ||
    getLocalValue(PICOCLAW_SESSION_ID_KEY, LEGACY_AI_SESSION_ID_KEY)
  );
}

export function setPicoclawSessionId(sessionId: string) {
  const sessionStore = getSessionStore();
  sessionStore?.setItem(PICOCLAW_SESSION_ID_KEY, sessionId);
  sessionStore?.removeItem(LEGACY_AI_SESSION_ID_KEY);
  setLocalValue(PICOCLAW_SESSION_ID_KEY, LEGACY_AI_SESSION_ID_KEY, sessionId);
}

export function clearPicoclawSessionId() {
  const sessionStore = getSessionStore();
  sessionStore?.removeItem(PICOCLAW_SESSION_ID_KEY);
  sessionStore?.removeItem(LEGACY_AI_SESSION_ID_KEY);
  removeLocalValue(PICOCLAW_SESSION_ID_KEY, LEGACY_AI_SESSION_ID_KEY);
}

export function getPicoclawMaxSteps() {
  const value = getLocalValue(PICOCLAW_MAX_STEPS_KEY, LEGACY_AI_MAX_STEPS_KEY);
  const parsed = value ? Number(value) : 20;
  return Math.max(1, Math.min(50, Number.isFinite(parsed) ? parsed : 20));
}

export function setPicoclawMaxSteps(maxSteps: number) {
  const value = Math.max(1, Math.min(50, Math.round(maxSteps)));
  setLocalValue(PICOCLAW_MAX_STEPS_KEY, LEGACY_AI_MAX_STEPS_KEY, String(value));
}

export function getPicoclawMaxRuntimeMs() {
  const value = getLocalValue(PICOCLAW_MAX_RUNTIME_KEY, LEGACY_AI_MAX_RUNTIME_KEY);
  const parsed = value ? Number(value) : 120000;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 120000;
  }
  return parsed;
}

export function setPicoclawMaxRuntimeMs(maxRuntimeMs: number) {
  const value = Math.max(1000, Math.round(maxRuntimeMs));
  setLocalValue(PICOCLAW_MAX_RUNTIME_KEY, LEGACY_AI_MAX_RUNTIME_KEY, String(value));
}

export function getPicoclawRuntimeInstallSnapshot(): PicoclawRuntimeInstallSnapshot | null {
  const value = getLocalValue(
    PICOCLAW_RUNTIME_INSTALL_SNAPSHOT_KEY,
    LEGACY_AI_RUNTIME_INSTALL_SNAPSHOT_KEY
  );
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as PicoclawRuntimeInstallSnapshot;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return {
      installing: parsed.installing === true,
      installProgress:
        typeof parsed.installProgress === 'number' ? parsed.installProgress : undefined,
      installStage: typeof parsed.installStage === 'string' ? parsed.installStage : undefined,
      status: typeof parsed.status === 'string' ? parsed.status : undefined
    };
  } catch {
    return null;
  }
}

export function setPicoclawRuntimeInstallSnapshot(snapshot: PicoclawRuntimeInstallSnapshot) {
  setLocalValue(
    PICOCLAW_RUNTIME_INSTALL_SNAPSHOT_KEY,
    LEGACY_AI_RUNTIME_INSTALL_SNAPSHOT_KEY,
    JSON.stringify(snapshot)
  );
}

export function clearPicoclawRuntimeInstallSnapshot() {
  removeLocalValue(PICOCLAW_RUNTIME_INSTALL_SNAPSHOT_KEY, LEGACY_AI_RUNTIME_INSTALL_SNAPSHOT_KEY);
}

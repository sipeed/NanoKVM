import { atom } from 'jotai';

export type AIControlMode = 'off' | 'mcp' | 'picoclaw';

export type AIControlStatus = {
  mode: AIControlMode;
  transitioning: boolean;
  canControlPicoclaw: boolean;
  changedAt?: string;
  lastError?: string;
  source?: string;
};

export const aiControlStatusAtom = atom<AIControlStatus | null>(null);

export function normalizeAIControlStatus(value: unknown, source?: string): AIControlStatus | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const control = asRecord(record.control);
  const capabilities = asRecord(record.capabilities);
  const mode = parseAIControlMode(
    control?.mode ?? record.mode ?? record.controlMode ?? record.control_mode
  );

  if (!mode) {
    return null;
  }

  const transitioning = readBoolean(control?.transitioning ?? record.transitioning) ?? false;
  const explicitCanControl = readBoolean(
    control?.can_control ?? record.can_control ?? record.canControlPicoclaw
  );
  const deviceWrite = readBoolean(capabilities?.device_write);
  const changedAt = readString(control?.changed_at ?? control?.changedAt ?? record.changed_at);
  const lastError = readString(control?.last_error ?? control?.lastError ?? record.last_error);
  const payloadSource = readString(control?.source ?? record.source);

  return {
    mode,
    transitioning,
    canControlPicoclaw:
      explicitCanControl ?? deviceWrite ?? (mode === 'picoclaw' && transitioning !== true),
    changedAt,
    lastError,
    source: source ?? payloadSource
  };
}

function parseAIControlMode(value: unknown): AIControlMode | null {
  if (value === 'off' || value === 'mcp' || value === 'picoclaw') {
    return value;
  }

  return null;
}

function readBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

function readString(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  return value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

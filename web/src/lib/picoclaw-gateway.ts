import { clearPicoclawSessionId, setPicoclawSessionId } from '@/lib/picoclaw-storage.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { normalizeLiteralEmptyText } from '@/lib/text.ts';
import type {
  GatewayAssistantMessage,
  GatewayClose,
  GatewayError,
  GatewayObservation,
  GatewayToolAction,
  PicoclawRunState,
  PicoclawTransportState
} from '@/types';

type GatewayEventMap = {
  connected: { sessionId: string };
  transport_state: PicoclawTransportState;
  run_state: PicoclawRunState;
  assistant_message: GatewayAssistantMessage;
  tool_action: GatewayToolAction;
  observation: GatewayObservation;
  error: GatewayError;
  close: GatewayClose;
};

type EventName = keyof GatewayEventMap;
type Listener<T extends EventName> = (payload: GatewayEventMap[T]) => void;

type ConnectOptions = {
  sessionId?: string;
  autoReconnect?: boolean;
};

type SendMessageOptions = {
  id?: string;
  maxSteps?: number;
  maxRuntimeMs?: number;
  trackState?: boolean;
};

const CLOSE_ERRORS: Record<number, string> = {
  4001: 'AI_LOCK_HELD',
  4002: 'RUNTIME_UNAVAILABLE',
  4003: 'AUTH_FAILED',
  4004: 'AI_TAKEN_OVER',
  4005: 'UPSTREAM_CLOSED'
};

export function generateUUIDv4() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

class PicoClawGateway {
  private ws: WebSocket | null = null;
  private listeners = new Map<EventName, Set<Listener<EventName>>>();
  private connectPromise: Promise<string> | null = null;
  private sessionId = '';
  private connectionAttemptId = 0;
  private autoReconnect = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private explicitClose = false;

  public connect(options: ConnectOptions = {}) {
    if (options.sessionId) {
      this.sessionId = options.sessionId;
      setPicoclawSessionId(options.sessionId);
    } else if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.sessionId = generateUUIDv4();
      setPicoclawSessionId(this.sessionId);
    }

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return this.connectPromise ?? Promise.resolve(this.sessionId);
    }

    this.autoReconnect = !!options.autoReconnect;
    this.explicitClose = false;
    this.clearReconnectTimer();
    this.setTransportState('connecting');

    const sessionId = this.sessionId || generateUUIDv4();
    const attemptId = ++this.connectionAttemptId;
    this.sessionId = sessionId;
    setPicoclawSessionId(sessionId);
    const url = `${getBaseUrl('ws')}/api/picoclaw/gateway/ws?session_id=${encodeURIComponent(sessionId)}`;

    this.connectPromise = new Promise<string>((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        if (this.ws !== ws || this.connectionAttemptId !== attemptId) {
          return;
        }
        this.reconnectAttempts = 0;
        this.emit('connected', { sessionId });
        this.setTransportState('connected');
        this.setRunState('idle');
        resolve(sessionId);
      };

      ws.onerror = () => {
        if (this.ws !== ws || this.connectionAttemptId !== attemptId) {
          return;
        }
        this.setTransportState('error');
      };

      ws.onclose = (event) => {
        if (this.ws !== ws || this.connectionAttemptId !== attemptId) {
          return;
        }
        this.ws = null;

        if (event.code !== 1000) {
          const code = CLOSE_ERRORS[event.code] || 'UNKNOWN';
          if (code !== 'UNKNOWN') {
            this.emit('error', {
              code,
              message: event.reason || code
            });
          }
        }

        this.emit('close', {
          code: event.code,
          reason: event.reason
        });

        this.setTransportState(event.code === 1000 ? 'disconnected' : 'error');
        this.setRunState('idle');

        if (!this.explicitClose) {
          reject(new Error(event.reason || 'gateway closed'));
          if (this.autoReconnect) {
            this.scheduleReconnect();
          }
        }
      };

      ws.onmessage = (event) => {
        if (this.ws !== ws || this.connectionAttemptId !== attemptId) {
          return;
        }
        this.handleMessage(event.data);
      };
    }).finally(() => {
      if (this.connectionAttemptId === attemptId) {
        this.connectPromise = null;
      }
    });

    return this.connectPromise;
  }

  public on<T extends EventName>(eventName: T, listener: Listener<T>) {
    const current = this.listeners.get(eventName) || new Set();
    current.add(listener as Listener<EventName>);
    this.listeners.set(eventName, current);

    return () => {
      current.delete(listener as Listener<EventName>);
      if (current.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  public sendChatMessage(content: string, options: SendMessageOptions = {}) {
    const trimmed = content.trim();
    if (!trimmed || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return null;
    }

    const id = options.id || generateUUIDv4();
    if (options.trackState !== false) {
      this.setRunState('busy');
    }

    this.ws.send(
      JSON.stringify({
        id,
        session_id: this.sessionId,
        type: 'message.send',
        payload: {
          content: trimmed,
          max_steps: options.maxSteps,
          max_runtime_ms: options.maxRuntimeMs
        }
      })
    );

    return { id, sessionId: this.sessionId };
  }

  public sendStopMessage() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.ws.send(
      JSON.stringify({
        type: 'message.cancel',
        session_id: this.sessionId,
        payload: {}
      })
    );
    return true;
  }

  public close(code = 1000, reason = 'NORMAL_CLOSURE') {
    this.explicitClose = true;
    this.clearReconnectTimer();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(code, reason);
    } else if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      this.ws.close();
    }

    this.ws = null;
    this.setTransportState('disconnected');
    this.setRunState('idle');
  }

  public rotateSession() {
    this.close();
    clearPicoclawSessionId();
    this.sessionId = generateUUIDv4();
    setPicoclawSessionId(this.sessionId);
    return this.sessionId;
  }

  public getSessionId() {
    return this.sessionId;
  }

  private scheduleReconnect() {
    this.clearReconnectTimer();
    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * this.reconnectAttempts, 5000);
    this.reconnectTimer = setTimeout(() => {
      this.connect({ sessionId: this.sessionId, autoReconnect: true }).catch(() => undefined);
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setTransportState(state: PicoclawTransportState) {
    this.emit('transport_state', state);
  }

  private setRunState(state: PicoclawRunState) {
    this.emit('run_state', state);
  }

  private handleMessage(rawData: string | ArrayBuffer | Blob) {
    if (typeof rawData !== 'string') {
      return;
    }

    let message: Record<string, unknown>;
    try {
      message = JSON.parse(rawData) as Record<string, unknown>;
    } catch {
      this.emit('error', {
        code: 'INVALID_MESSAGE',
        message: 'Failed to parse gateway message',
        raw: rawData
      });
      return;
    }

    const type = String(message.type || '');
    if (type === 'typing.start') {
      this.setRunState('busy');
      return;
    }
    if (type === 'typing.stop') {
      return;
    }
    if (type === 'pong') {
      return;
    }
    if (type === 'error') {
      this.setTransportState('error');
      this.setRunState('idle');
      this.emit('error', {
        code: String(message.code || 'ERROR'),
        message: String(message.message || 'Gateway error'),
        raw: message
      });
      return;
    }
    if (type === 'message.create' || type === 'message.update') {
      this.setRunState('idle');
      this.emit('assistant_message', {
        id: String(message.id || generateUUIDv4()),
        text: extractText(message),
        raw: message
      });
      return;
    }

    const imageBase64 = extractImageBase64(message);
    if (imageBase64) {
      this.emit('observation', {
        id: String(message.id || generateUUIDv4()),
        text: extractText(message),
        imageBase64,
        raw: message
      });
      return;
    }

    const action = extractAction(message);
    if (action) {
      this.emit('tool_action', {
        id: String(message.id || generateUUIDv4()),
        action: action.action,
        x: action.x,
        y: action.y,
        raw: message
      });
      return;
    }
  }

  private emit<T extends EventName>(eventName: T, payload: GatewayEventMap[T]) {
    const current = this.listeners.get(eventName);
    if (!current) {
      return;
    }

    current.forEach((listener) => {
      (listener as Listener<T>)(payload);
    });
  }
}

function extractText(message: Record<string, unknown>) {
  const payload = (message.payload || {}) as Record<string, unknown>;
  const content = payload.content ?? message.content ?? payload.text ?? message.text;

  if (typeof content === 'string') {
    return normalizeLiteralEmptyText(content);
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return normalizeLiteralEmptyText(item);
        }
        if (item && typeof item === 'object' && 'text' in item) {
          return normalizeLiteralEmptyText(String((item as Record<string, unknown>).text || ''));
        }
        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  return '';
}

function extractImageBase64(message: Record<string, unknown>) {
  const payload = (message.payload || {}) as Record<string, unknown>;
  const data = (payload.data || message.data || {}) as Record<string, unknown>;

  const value = data.image_base64 || payload.image_base64 || message.image_base64;

  return typeof value === 'string' ? value : undefined;
}

function extractAction(message: Record<string, unknown>) {
  const payload = (message.payload || {}) as Record<string, unknown>;
  const actionValue = payload.action || message.action || payload.tool_name || message.tool_name;

  if (typeof actionValue !== 'string') {
    return null;
  }

  const action = normalizeLiteralEmptyText(actionValue);
  if (!action) {
    return null;
  }

  const x = typeof payload.x === 'number' ? payload.x : undefined;
  const y = typeof payload.y === 'number' ? payload.y : undefined;

  return {
    action,
    x,
    y
  };
}

export const picoclawGateway = new PicoClawGateway();

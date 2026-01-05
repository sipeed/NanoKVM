import { IMessageEvent, w3cwebsocket as W3cWebSocket } from 'websocket';

import { getBaseUrl } from '@/lib/service.ts';

type MessageHandler = (message: IMessageEvent) => void;
type SendData = number[] | ArrayBuffer | Uint8Array;

export enum MessageEvent {
  Heartbeat = 0,
  Keyboard = 1,
  Mouse = 2
}

interface WsClientOptions {
  url?: string;
  heartbeatInterval?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

const DEFAULT_OPTIONS: Required<WsClientOptions> = {
  url: `${getBaseUrl('ws')}/api/ws`,
  heartbeatInterval: 10 * 1000,
  reconnectInterval: 3 * 1000,
  maxReconnectAttempts: 1
};

export class WsClient {
  private readonly options: Required<WsClientOptions>;
  private instance: W3cWebSocket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private shouldReconnect = true;

  private readonly eventHandlers = new Map<string, Set<MessageHandler>>();

  constructor(options: WsClientOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  public connect(): void {
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.createConnection();
  }

  public close(): void {
    this.shouldReconnect = false;
    this.cleanup();

    if (this.instance && this.instance.readyState === W3cWebSocket.OPEN) {
      this.instance.close();
    }

    this.instance = null;
  }

  public on(type: string, handler: MessageHandler): () => void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, new Set());
    }

    this.eventHandlers.get(type)!.add(handler);

    return () => {
      const handlers = this.eventHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(type);
        }
      }
    };
  }

  public off(type: string, handler?: MessageHandler): void {
    if (handler) {
      const handlers = this.eventHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(type);
        }
      }
    } else {
      this.eventHandlers.delete(type);
    }
  }

  public send(data: SendData): boolean {
    if (!this.instance || !this.isConnected) {
      return false;
    }

    if (data instanceof ArrayBuffer || (data as unknown) instanceof Uint8Array) {
      this.instance.send(data);
    } else {
      this.instance.send(JSON.stringify(data));
    }

    return true;
  }

  public get isConnected(): boolean {
    return this.instance?.readyState === W3cWebSocket.OPEN;
  }

  private createConnection(): void {
    this.cleanup();

    this.instance = new W3cWebSocket(this.options.url);
    this.instance.binaryType = 'arraybuffer';

    this.instance.onopen = this.handleOpen.bind(this);
    this.instance.onclose = this.handleClose.bind(this);
    this.instance.onerror = this.handleError.bind(this);
    this.instance.onmessage = this.handleMessage.bind(this);
  }

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.startHeartbeat();
  }

  private handleClose(): void {
    this.stopHeartbeat();
    this.scheduleReconnect();
  }

  private handleError(error: Error): void {
    console.error('[WebSocket] Error:', error);
  }

  private handleMessage(message: IMessageEvent): void {
    try {
      const data = JSON.parse(message.data as string);
      const handlers = this.eventHandlers.get(data.type);

      if (handlers) {
        handlers.forEach((handler) => handler(message));
      }
    } catch (err) {
      console.log(err);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send(new Uint8Array([MessageEvent.Heartbeat]));
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting... (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.createConnection();
    }, this.options.reconnectInterval);
  }

  private cleanup(): void {
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const client = new WsClient();

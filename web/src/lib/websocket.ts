import { IMessageEvent, w3cwebsocket as W3cWebSocket } from 'websocket';

import { getBaseUrl } from '@/lib/service.ts';

type Event = (message: IMessageEvent) => void;

const eventMap: Map<string, Event> = new Map<string, Event>();

class WsClient {
  private readonly url: string;
  private instance: W3cWebSocket;

  constructor() {
    this.url = `${getBaseUrl('ws')}/api/ws`;
    this.instance = new W3cWebSocket(this.url);
    this.setEvents();
  }

  public connect() {
    this.close();

    this.instance = new W3cWebSocket(this.url);
    this.setEvents();
  }

  public send(data: number[]) {
    if (this.instance.readyState !== W3cWebSocket.OPEN) {
      return;
    }

    const message = JSON.stringify(data);
    this.instance.send(message);
  }

  public close() {
    if (this.instance.readyState === W3cWebSocket.OPEN) {
      this.instance.close();
    }
  }

  public register(type: string, fn: (message: IMessageEvent) => void) {
    eventMap.set(type, fn);

    this.setEvents();
  }

  public unregister(type: string) {
    eventMap.delete(type);

    this.setEvents();
  }

  private setEvents() {
    this.instance.onmessage = (message) => {
      const data = JSON.parse(message.data as string);
      if (!data) return;

      const fn = eventMap.get(data.type);
      if (!fn) return;

      fn(message);
    };
  }
}

export const client = new WsClient();

import { w3cwebsocket as W3cWebSocket } from 'websocket';

import { getBaseUrl } from '@/lib/service.ts';

class WsClient {
  private readonly url: string;
  private instance: W3cWebSocket;

  constructor() {
    this.url = `${getBaseUrl('ws')}/api/ws`;
    this.instance = new W3cWebSocket(this.url);
  }

  public connect() {
    this.close();

    this.instance = new W3cWebSocket(this.url);
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
}

export const client = new WsClient();

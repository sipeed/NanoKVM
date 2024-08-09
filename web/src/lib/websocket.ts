import { w3cwebsocket as W3cWebSocket } from 'websocket';

class WsClient {
  private instance: W3cWebSocket;

  constructor() {
    const url = this.getUrl();
    this.instance = new W3cWebSocket(url);
  }

  private getUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/ws`;
  }

  public connect() {
    this.close();

    const url = this.getUrl();
    this.instance = new W3cWebSocket(url);
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

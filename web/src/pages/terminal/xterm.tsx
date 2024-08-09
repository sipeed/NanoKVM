import { useEffect } from 'react';
import { AttachAddon } from '@xterm/addon-attach';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XtermTerminal } from '@xterm/xterm';

import '@xterm/xterm/css/xterm.css';

type TerminalProps = {
  token: string;
  setToken: (token: string) => void;
};

export const Xterm = ({ token, setToken }: TerminalProps) => {
  useEffect(() => {
    const terminalEle = document.getElementById('terminal');
    if (!terminalEle) return;

    const terminal = new XtermTerminal();
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalEle);
    fitAddon.fit();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/api/vm/terminal?${token}`;
    const webSocket = new WebSocket(url);

    const sendSize = () => {
      const windowSize = { high: terminal.rows, width: terminal.cols };
      const blob = new Blob([JSON.stringify(windowSize)], { type: 'application/json' });
      webSocket.send(blob);
    };

    const resizeScreen = () => {
      fitAddon.fit();
      sendSize();
    };
    window.addEventListener('resize', resizeScreen, false);

    const attachAddon = new AttachAddon(webSocket);
    terminal.loadAddon(attachAddon);

    webSocket.onopen = () => {
      sendSize();
      setTimeout(runPicocom, 300);
    };
    webSocket.onerror = () => {
      setToken('');
    };
    webSocket.onclose = () => {
      setToken('');
    };

    const runPicocom = () => {
      const urls = window.location.href.split('?');
      if (urls.length < 2) return;

      const searchParams = new URLSearchParams(urls[1]);
      const port = searchParams.get('port');
      const baud = searchParams.get('baud');
      if (!port || !baud) return;

      webSocket.send(`picocom ${port} -b ${baud}\r`);
    };

    return () => {
      window.removeEventListener('resize', resizeScreen, false);
      if (webSocket.readyState === 1) {
        webSocket.close();
      }
    };
  }, []);

  return (
    <div className="h-full w-full overflow-hidden">
      <div id="terminal" className="h-full p-2"></div>
    </div>
  );
};

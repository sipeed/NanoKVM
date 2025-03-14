import { useEffect } from 'react';
import { AttachAddon } from '@xterm/addon-attach';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { useTranslation } from 'react-i18next';

import '@xterm/xterm/css/xterm.css';

import { getBaseUrl } from '@/lib/service.ts';
import { Head } from '@/components/head.tsx';

export const Terminal = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const terminalEle = document.getElementById('terminal');
    if (!terminalEle) return;

    const terminal = new XtermTerminal({
      cursorBlink: true
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalEle);
    fitAddon.fit();

    const url = `${getBaseUrl('ws')}/api/vm/terminal`;
    const ws = new WebSocket(url);
    ws.onopen = () => {
      const attachAddon = new AttachAddon(ws);
      terminal.loadAddon(attachAddon);

      sendSize();
      setTimeout(runPicocom, 300);
    };

    const sendSize = () => {
      const windowSize = { rows: terminal.rows, cols: terminal.cols };
      const blob = new Blob([JSON.stringify(windowSize)], { type: 'application/json' });
      ws.send(blob);
    };

    const runPicocom = () => {
      const urls = window.location.href.split('?');
      if (urls.length < 2) return;

      const searchParams = new URLSearchParams(urls[1]);
      const port = searchParams.get('port');
      const baud = searchParams.get('baud');
      const parity = searchParams.get('parity');
      const flowControl = searchParams.get('flowControl');
      const dataBits = searchParams.get('dataBits');
      const stopBits = searchParams.get('stopBits');
      if (!port || !baud) return;

      ws.send(`picocom ${port} --baud ${baud} --parity ${parity} --flow ${flowControl} --databits ${dataBits} --stopbits ${stopBits}\r`);
    };

    const resizeScreen = () => {
      fitAddon.fit();
      sendSize();
    };
    window.addEventListener('resize', resizeScreen, false);

    return () => {
      terminal.dispose();

      if (ws.readyState === 1) {
        ws.close();
      }

      window.removeEventListener('resize', resizeScreen, false);
    };
  }, []);

  return (
    <>
      <Head title={t('head.terminal')} />

      <div className="h-full w-full overflow-hidden">
        <div id="terminal" className="h-full p-2"></div>
      </div>
    </>
  );
};

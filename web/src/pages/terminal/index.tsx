import { useCallback, useEffect, useRef, useState } from 'react';
import { AttachAddon } from '@xterm/addon-attach';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { Button, notification } from 'antd';
import { useTranslation } from 'react-i18next';

import '@xterm/xterm/css/xterm.css';

import { notifyAuthExpired, notifyAuthRefresh } from '@/lib/auth-events.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { Head } from '@/components/head.tsx';

import { validatePicocomParameters } from './validater.ts';

const disconnectedNotificationKey = 'terminal-disconnected';
const heartbeatDelay = 250;
const heartbeatTimeout = 1000;
const heartbeatPing = JSON.stringify({ type: 'ping' });
const heartbeatPong = '{"type":"pong"}';

export const Terminal = () => {
  const { t } = useTranslation();
  const [notify, contextHolder] = notification.useNotification();
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const terminalRef = useRef<XtermTerminal | null>(null);
  const disconnectedTimerRef = useRef<number | undefined>(undefined);

  const stopDisconnectedTimer = () => {
    if (disconnectedTimerRef.current !== undefined) {
      window.clearInterval(disconnectedTimerRef.current);
      disconnectedTimerRef.current = undefined;
    }
  };

  const handleReconnect = useCallback(() => {
    stopDisconnectedTimer();
    notify.destroy(disconnectedNotificationKey);
    setConnectionAttempt((attempt) => attempt + 1);
  }, [notify]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    const terminalEle = document.getElementById('terminal');
    if (!terminalEle) return;

    const terminal = new XtermTerminal({
      cursorBlink: true
    });
    terminalRef.current = terminal;

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalEle);
    fitAddon.fit();

    const url = `${getBaseUrl('ws')}/api/vm/terminal`;
    const ws = new WebSocket(url);
    let isPicocomRunning = false;
    let isDisposed = false;
    let hasDisconnected = false;
    let lastResponseAt = Date.now();
    let picocomTimer: number | undefined;
    let closeTimer: number | undefined;
    let heartbeatTimer: number | undefined;
    let heartbeatResponseTimer: number | undefined;

    ws.addEventListener('close', (event) => {
      if (event.code === 4401) {
        notifyAuthExpired();
        return;
      }

      if (event.code === 4403) {
        // Permissions changed but the login is still valid: refreshing the
        // account lets the route guard move away from a shell the account may
        // no longer use.
        notifyAuthRefresh();
      }
    });

    const stopHeartbeat = () => {
      if (heartbeatTimer !== undefined) {
        window.clearTimeout(heartbeatTimer);
        heartbeatTimer = undefined;
      }
      if (heartbeatResponseTimer !== undefined) {
        window.clearTimeout(heartbeatResponseTimer);
        heartbeatResponseTimer = undefined;
      }
    };

    const showDisconnectedNotification = () => {
      if (isDisposed || hasDisconnected) return;

      hasDisconnected = true;
      stopHeartbeat();
      setIsDisconnected(true);
      terminal.options.disableStdin = true;
      stopDisconnectedTimer();

      const updateNotification = () => {
        if (isDisposed) return;

        const seconds = Math.max(0, Math.floor((Date.now() - lastResponseAt) / 1000));
        // 只更新中间磨砂的计时文本，不再弹右下角通知
        const timerEle = document.getElementById('terminal-disconnected-timer');
        if (timerEle) {
          timerEle.textContent = t('terminal.lastResponse', { seconds });
        }
      };

      updateNotification();
      disconnectedTimerRef.current = window.setInterval(updateNotification, 1000);
    };

    const sendHeartbeat = () => {
      if (isDisposed || hasDisconnected || ws.readyState !== WebSocket.OPEN) return;

      const blob = new Blob([heartbeatPing], { type: 'application/json' });
      ws.send(blob);
      heartbeatResponseTimer = window.setTimeout(() => {
        if (isDisposed || hasDisconnected) return;

        showDisconnectedNotification();
        ws.close();
      }, heartbeatTimeout);
    };

    const sendSize = () => {
      if (ws.readyState !== WebSocket.OPEN) return;

      const windowSize = { rows: terminal.rows, cols: terminal.cols };
      const blob = new Blob([JSON.stringify(windowSize)], { type: 'application/json' });
      ws.send(blob);
    };

    const runPicocom = () => {
      if (isDisposed || ws.readyState !== WebSocket.OPEN) return;

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

      if (!validatePicocomParameters({ port, baud, parity, flowControl, dataBits, stopBits })) {
        return;
      }

      ws.send(
        `picocom ${port} --baud ${baud} --parity ${parity} --flow ${flowControl} --databits ${dataBits} --stopbits ${stopBits}\r`
      );

      isPicocomRunning = true;
    };

    const exitPicocom = () => {
      if (ws.readyState === WebSocket.OPEN && isPicocomRunning) {
        ws.send('\x01\x18');
        isPicocomRunning = false;
      }
    };

    const resizeScreen = () => {
      fitAddon.fit();
      sendSize();
    };

    const cleanupConnection = () => {
      exitPicocom();

      if (closeTimer !== undefined) {
        window.clearTimeout(closeTimer);
      }

      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
        return;
      }
      if (ws.readyState !== WebSocket.OPEN) return;

      closeTimer = window.setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }, 100);
    };

    const handleBeforeUnload = () => {
      isDisposed = true;
      stopHeartbeat();
      stopDisconnectedTimer();
      cleanupConnection();
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data === heartbeatPong) {
        event.stopImmediatePropagation();
      }
      if (isDisposed || hasDisconnected) return;

      lastResponseAt = Date.now();
      if (event.data !== heartbeatPong) return;

      if (heartbeatResponseTimer !== undefined) {
        window.clearTimeout(heartbeatResponseTimer);
        heartbeatResponseTimer = undefined;
      }
      heartbeatTimer = window.setTimeout(sendHeartbeat, heartbeatDelay);
    };

    ws.onopen = () => {
      if (isDisposed) return;

      lastResponseAt = Date.now();
      setIsDisconnected(false);
      terminal.options.disableStdin = false;
      stopDisconnectedTimer();
      notify.destroy(disconnectedNotificationKey);

      const attachAddon = new AttachAddon(ws);
      terminal.loadAddon(attachAddon);

      sendSize();
      sendHeartbeat();
      picocomTimer = window.setTimeout(runPicocom, 300);
    };
    ws.onclose = showDisconnectedNotification;
    ws.addEventListener('message', handleMessage);

    window.addEventListener('resize', resizeScreen, false);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isDisposed = true;
      stopHeartbeat();
      stopDisconnectedTimer();
      if (picocomTimer !== undefined) {
        window.clearTimeout(picocomTimer);
      }
      notify.destroy(disconnectedNotificationKey);

      terminal.dispose();
      cleanupConnection();
      ws.removeEventListener('message', handleMessage);

      window.removeEventListener('resize', resizeScreen, false);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [connectionAttempt, notify, t]);

  return (
    <>
      {contextHolder}
      <Head title={t('head.terminal')} />

      <div className="relative h-full w-full overflow-hidden">
        <div
          id="terminal"
          className={`h-full p-2 transition-all duration-300 ${
            isDisconnected ? 'pointer-events-none blur-sm' : ''
          }`}
        ></div>
        {isDisconnected && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-lg bg-neutral-900/80 px-8 py-6 text-center">
              <div className="text-lg font-medium text-white">{t('terminal.unresponsive')}</div>
              <div id="terminal-disconnected-timer" className="text-sm text-neutral-400">
                {t('terminal.lastResponse', { seconds: 0 })}
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRefresh}>{t('terminal.refreshPage')}</Button>
                <Button type="primary" onClick={handleReconnect}>
                  {t('terminal.reconnect')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

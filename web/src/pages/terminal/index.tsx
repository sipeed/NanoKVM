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
const terminalSessionIDType = 'session';

function formatLastResponseTime(timestamp: number, language: string) {
  const date = new Date(timestamp);

  if (language.toLowerCase().startsWith('zh')) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${pad(date.getHours())}：${pad(date.getMinutes())}：${pad(date.getSeconds())}`;
  }

  try {
    return new Intl.DateTimeFormat(language.replace('_', '-'), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

// The terminal page forwards its hash query to the websocket: the session id
// used to reattach to an existing session (e.g. /#terminal?session=<id>) and the
// serial port parameters (e.g. /#terminal?port=/dev/ttyUSB0&baud=115200) used to
// describe a new serial session.
const terminalQueryKeys = ['session', 'port', 'baud', 'parity', 'flowControl', 'dataBits', 'stopBits'];

function getTerminalQuery() {
  const urls = window.location.href.split('?');
  if (urls.length < 2) return new URLSearchParams();

  return new URLSearchParams(urls[1]);
}

function getTerminalWsUrl() {
  const url = `${getBaseUrl('ws')}/api/vm/terminal`;
  const source = getTerminalQuery();
  const params = new URLSearchParams();

  for (const key of terminalQueryKeys) {
    const value = source.get(key);
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${url}?${query}` : url;
}

function rememberTerminalSession(sessionID: string) {
  const hashRoute = window.location.hash.split('?')[0] || '#terminal';
  const params = getTerminalQuery();
  params.set('session', sessionID);
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${window.location.search}${hashRoute}?${params.toString()}`
  );
}

// The backend uses these application-defined close codes when another page
// takes over the session, when the session is closed from the settings page or
// when the session ends on the device side.
const terminalTakenOverCode = 4409;
const terminalClosedCode = 4410;
const terminalSessionEndedCode = 4411;
const terminalAppCloseCodeMin = 4000;
const terminalAppCloseCodeMax = 4999;

export const Terminal = () => {
  const { t, i18n } = useTranslation();
  const [notify, contextHolder] = notification.useNotification();
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [closedReason, setClosedReason] = useState<
    'unavailable' | 'takenOver' | 'closed' | 'ended' | 'remoteClosed' | null
  >(null);
  const lastResponseAtRef = useRef(Date.now());
  const disconnectedTimerRef = useRef<number | undefined>(undefined);
  const language = i18n.resolvedLanguage || i18n.language;
  const [sessionID, setSessionID] = useState(() => getTerminalQuery().get('session'));

  const stopDisconnectedTimer = useCallback(() => {
    if (disconnectedTimerRef.current !== undefined) {
      window.clearInterval(disconnectedTimerRef.current);
      disconnectedTimerRef.current = undefined;
    }
  }, []);

  const handleReconnect = useCallback(() => {
    stopDisconnectedTimer();
    notify.destroy(disconnectedNotificationKey);
    setConnectionAttempt((attempt) => attempt + 1);
  }, [notify, stopDisconnectedTimer]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

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

    // A session id in the page URL means "reattach to this session"; without it
    // a new shell is created.
    const isReconnect = Boolean(getTerminalQuery().get('session'));
    const url = getTerminalWsUrl();
    const ws = new WebSocket(url);
    let isPicocomRunning = false;
    let isDisposed = false;
    let hasDisconnected = false;
    let hasOpened = false;
    let picocomTimer: number | undefined;
    let closeTimer: number | undefined;
    let heartbeatTimer: number | undefined;
    let heartbeatResponseTimer: number | undefined;
    lastResponseAtRef.current = Date.now();

    ws.addEventListener('close', (event) => {
      if (!hasOpened) {
        setClosedReason('unavailable');
        return;
      }

      if (event.code === terminalTakenOverCode) {
        setClosedReason('takenOver');
        return;
      }

      if (event.code === terminalClosedCode) {
        setClosedReason('closed');
        return;
      }

      if (event.code === terminalSessionEndedCode) {
        setClosedReason('ended');
        return;
      }

      if (event.code === 4401) {
        notifyAuthExpired();
        return;
      }

      if (event.code === 4403) {
        // Permissions changed but the login is still valid: refreshing the
        // account lets the route guard move away from a shell the account may
        // no longer use.
        notifyAuthRefresh();
        return;
      }

      // Any other application-defined close means the server actively dropped
      // the connection; show that instead of leaving a frozen terminal.
      if (event.code >= terminalAppCloseCodeMin && event.code <= terminalAppCloseCodeMax) {
        setClosedReason('remoteClosed');
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

        const lastResponseAt = lastResponseAtRef.current;
        const seconds = Math.max(0, Math.floor((Date.now() - lastResponseAt) / 1000));
        const timerEle = document.getElementById('terminal-disconnected-timer');
        if (timerEle) {
          timerEle.textContent = t('terminal.lastResponse', {
            time: formatLastResponseTime(lastResponseAt, language),
            seconds
          });
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

      const searchParams = getTerminalQuery();
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

      if (typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data) as { type?: string; sessionId?: string };
          if (
            message.type === terminalSessionIDType &&
            typeof message.sessionId === 'string' &&
            message.sessionId.length > 0
          ) {
            rememberTerminalSession(message.sessionId);
            setSessionID(message.sessionId);
            event.stopImmediatePropagation();
            return;
          }
        } catch {
          // Regular terminal output is not a control message.
        }
      }

      lastResponseAtRef.current = Date.now();
      if (event.data !== heartbeatPong) return;

      if (heartbeatResponseTimer !== undefined) {
        window.clearTimeout(heartbeatResponseTimer);
        heartbeatResponseTimer = undefined;
      }
      heartbeatTimer = window.setTimeout(sendHeartbeat, heartbeatDelay);
    };

    ws.onopen = () => {
      if (isDisposed) return;

      hasOpened = true;
      setClosedReason(null);
      lastResponseAtRef.current = Date.now();
      setIsDisconnected(false);
      terminal.options.disableStdin = false;
      stopDisconnectedTimer();
      notify.destroy(disconnectedNotificationKey);

      const attachAddon = new AttachAddon(ws);
      terminal.loadAddon(attachAddon);

      sendSize();
      sendHeartbeat();
      if (!isReconnect) {
        picocomTimer = window.setTimeout(runPicocom, 300);
      }
    };
    ws.onclose = (event) => {
      // A page that never opened, lost the session to another page, lost its
      // login or was closed by the server shows its own overlay instead; only a
      // live terminal that goes silent is treated as unresponsive.
      if (!hasOpened) return;
      if (event.code >= terminalAppCloseCodeMin && event.code <= terminalAppCloseCodeMax) {
        return;
      }

      showDisconnectedNotification();
    };
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
  }, [connectionAttempt, language, notify, stopDisconnectedTimer, t]);

  function openNewTerminal() {
    window.open('/#terminal', '_blank');
  }

  function reconnectSession() {
    window.location.reload();
  }

  let closedTitle = t('terminal.sessionUnavailable');
  let closedHint = '';
  let canReconnect = false;

  if (closedReason === 'takenOver') {
    closedTitle = t('terminal.takenOver');
    closedHint = t('terminal.takenOverHint');
    canReconnect = Boolean(sessionID);
  } else if (closedReason === 'closed') {
    closedTitle = t('terminal.closedRemotely');
    closedHint = t('terminal.closedRemotelyHint');
  } else if (closedReason === 'ended') {
    closedTitle = t('terminal.sessionEnded');
    closedHint = t('terminal.sessionEndedHint');
  } else if (closedReason === 'remoteClosed') {
    closedTitle = t('terminal.remoteClosed');
    closedHint = t('terminal.remoteClosedHint');
    canReconnect = Boolean(sessionID);
  }

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
                {t('terminal.lastResponse', {
                  time: formatLastResponseTime(lastResponseAtRef.current, language),
                  seconds: Math.max(0, Math.floor((Date.now() - lastResponseAtRef.current) / 1000))
                })}
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

        {closedReason && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex max-w-[420px] flex-col items-center gap-3 rounded-lg bg-neutral-900/90 px-8 py-6 text-center">
              <div className="text-lg font-medium text-white">{closedTitle}</div>

              {closedHint && (
                <div className="text-sm text-neutral-400">{closedHint}</div>
              )}

              {canReconnect ? (
                <Button type="primary" onClick={reconnectSession}>
                  {t('terminal.reconnect')}
                </Button>
              ) : (
                <Button type="primary" onClick={openNewTerminal}>
                  {t('terminal.newTerminal')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

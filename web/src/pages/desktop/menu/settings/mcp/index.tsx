import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Button, Divider, message, Modal, Switch } from 'antd';
import { useSetAtom } from 'jotai';
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon, RefreshCcwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/mcp.ts';
import type { MCPConfig } from '@/api/mcp.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { aiControlStatusAtom, normalizeAIControlStatus } from '@/jotai/ai-control.ts';

function maskKey(key: string) {
  if (!key) return '-';
  if (key.length <= 16) return `${key.slice(0, 4)}...${key.slice(-4)}`;
  return `${key.slice(0, 12)}...${key.slice(-6)}`;
}

function responseMessage(rsp: { msg?: string; message?: string }) {
  return rsp.msg || rsp.message || '';
}

async function writeClipboardText(text: string) {
  if (window.isSecureContext === true && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the legacy path for HTTP deployments and browser quirks.
    }
  }

  const textArea = document.createElement('textarea');
  const selection = document.getSelection();
  const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, text.length);

  try {
    if (!document.execCommand('copy')) {
      throw new Error('copy command failed');
    }
  } finally {
    document.body.removeChild(textArea);
    if (selectedRange && selection) {
      selection.removeAllRanges();
      selection.addRange(selectedRange);
    }
  }
}

export const MCP = () => {
  const { t } = useTranslation();
  const [modal, contextHolder] = Modal.useModal();
  const setAIControlStatus = useSetAtom(aiControlStatusAtom);
  const [config, setConfig] = useState<MCPConfig>({
    enabled: false,
    apiKey: '',
    controlMode: 'picoclaw',
    transitioning: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isEndpointCopied, setIsEndpointCopied] = useState(false);
  const [isKeyCopied, setIsKeyCopied] = useState(false);
  const isLoadingRef = useRef(false);
  const silentRefreshRef = useRef(false);
  const actionVersionRef = useRef(0);

  const endpoint = useMemo(() => `${getBaseUrl('http')}/api/mcp`, []);
  const displayKey = isKeyVisible ? config.apiKey || '-' : maskKey(config.apiKey);

  const syncConfig = useCallback(
    (nextConfig: MCPConfig) => {
      setConfig(nextConfig);
      const nextControlStatus = normalizeAIControlStatus(nextConfig, 'mcp_config');
      if (nextControlStatus) {
        setAIControlStatus(nextControlStatus);
      }
    },
    [setAIControlStatus]
  );

  const updateLoading = useCallback((loading: boolean) => {
    isLoadingRef.current = loading;
    setIsLoading(loading);
  }, []);

  const getConfig = useCallback(
    (silent = false) => {
      if (silent) {
        if (isLoadingRef.current || silentRefreshRef.current) return;
        silentRefreshRef.current = true;
      } else {
        updateLoading(true);
      }
      const actionVersion = actionVersionRef.current;

      api
        .getMCPConfig()
        .then((rsp) => {
          if (rsp.code !== 0) {
            if (!silent) message.error(t('settings.mcp.failed'));
            return;
          }
          if (silent && actionVersion !== actionVersionRef.current) return;
          syncConfig(rsp.data);
          if (!rsp.data.enabled) setIsKeyVisible(false);
        })
        .catch(() => {
          if (!silent) message.error(t('settings.mcp.failed'));
        })
        .finally(() => {
          if (silent) silentRefreshRef.current = false;
          else updateLoading(false);
        });
    },
    [syncConfig, t, updateLoading]
  );

  useEffect(() => {
    getConfig();
    const timer = window.setInterval(() => getConfig(true), 3000);
    return () => window.clearInterval(timer);
  }, [getConfig]);

  function updateEnabled(enabled: boolean) {
    if (isLoading) return;
    actionVersionRef.current += 1;
    updateLoading(true);
    api
      .setMCPEnabled(enabled)
      .then((rsp) => {
        if (rsp.code !== 0) {
          message.error(responseMessage(rsp) || t('settings.mcp.failed'));
          return;
        }
        syncConfig(rsp.data);
        if (!enabled) setIsKeyVisible(false);
      })
      .catch(() => message.error(t('settings.mcp.failed')))
      .finally(() => updateLoading(false));
  }

  function setEnabled(enabled: boolean) {
    if (!enabled) {
      updateEnabled(false);
      return;
    }

    modal.confirm({
      title: t('settings.mcp.enableConfirmTitle'),
      content: (
        <span className="text-sm text-neutral-400">{t('settings.mcp.enableConfirmDesc')}</span>
      ),
      okText: t('settings.mcp.okBtn'),
      cancelText: t('settings.mcp.cancelBtn'),
      onOk: () => updateEnabled(true)
    });
  }

  async function copyText(text: string, type: 'endpoint' | 'key') {
    if (!text) return;
    try {
      await writeClipboardText(text);
      const setCopied = type === 'endpoint' ? setIsEndpointCopied : setIsKeyCopied;
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error(
        t('settings.mcp.copyFailed', {
          defaultValue: 'Copy failed. Copy manually.'
        })
      );
    }
  }

  function regenerateKey() {
    if (isLoading || !config.enabled) return;
    modal.confirm({
      title: t('settings.mcp.regenerateConfirmTitle'),
      content: (
        <span className="text-sm text-neutral-400">{t('settings.mcp.regenerateConfirmDesc')}</span>
      ),
      okText: t('settings.mcp.okBtn'),
      cancelText: t('settings.mcp.cancelBtn'),
      onOk: async () => {
        actionVersionRef.current += 1;
        updateLoading(true);
        try {
          const rsp = await api.regenerateMCPAPIKey();
          if (rsp.code !== 0) {
            message.error(responseMessage(rsp) || t('settings.mcp.failed'));
            return;
          }
          syncConfig(rsp.data);
          setIsKeyVisible(false);
        } catch {
          message.error(t('settings.mcp.failed'));
        } finally {
          updateLoading(false);
        }
      }
    });
  }

  return (
    <>
      {contextHolder}
      <div className="text-base">{t('settings.mcp.title')}</div>
      <Divider className="opacity-50" />

      <div className="flex flex-col space-y-6">
        <Alert type="warning" showIcon message={t('settings.mcp.securityWarning')} />

        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1 pr-4">
            <span className="text-sm font-medium">{t('settings.mcp.service')}</span>
            <span className="text-xs text-neutral-500">{t('settings.mcp.serviceDesc')}</span>
          </div>
          <Switch
            checked={config.enabled}
            loading={isLoading || config.transitioning}
            disabled={config.transitioning}
            onChange={(enabled) => setEnabled(enabled)}
          />
        </div>

        {config.enabled && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-800/40 shadow-sm">
              <CredentialRow
                label={t('settings.mcp.endpoint')}
                value={endpoint}
                copied={isEndpointCopied}
                onCopy={() => copyText(endpoint, 'endpoint')}
              />
              <div className="border-t border-neutral-800" />
              <CredentialRow
                label={t('settings.mcp.apiKey')}
                value={displayKey}
                copied={isKeyCopied}
                onCopy={() => copyText(config.apiKey, 'key')}
                disabled={!config.apiKey}
                actions={
                  <>
                    <Button
                      type="text"
                      size="small"
                      className="text-neutral-400 hover:text-white"
                      icon={isKeyVisible ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                      disabled={!config.apiKey}
                      onClick={() => setIsKeyVisible((visible) => !visible)}
                    />
                    <Button
                      type="text"
                      size="small"
                      className="text-neutral-400 hover:text-white"
                      loading={isLoading}
                      icon={<RefreshCcwIcon size={15} />}
                      onClick={regenerateKey}
                    />
                  </>
                }
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

type CredentialRowProps = {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  disabled?: boolean;
  actions?: ReactNode;
};

const CredentialRow = ({
  label,
  value,
  copied,
  onCopy,
  disabled = false,
  actions
}: CredentialRowProps) => (
  <div className="group flex flex-col space-y-2 px-4 py-3.5 transition-colors hover:bg-neutral-800/40 sm:flex-row sm:items-center sm:justify-between">
    <span className="w-24 shrink-0 text-sm font-medium text-neutral-400">{label}</span>
    <div className="flex min-w-0 items-center justify-between gap-2">
      <span className="min-w-0 flex-1 select-all truncate font-mono text-sm text-neutral-300">
        {value}
      </span>
      <div className="flex shrink-0 items-center space-x-1 opacity-40 transition-opacity group-hover:opacity-100 sm:ml-4">
        {actions}
        <Button
          type="text"
          size="small"
          className="text-neutral-400 hover:text-white"
          icon={
            copied ? <CheckIcon size={15} className="text-green-500" /> : <CopyIcon size={15} />
          }
          disabled={disabled}
          onClick={onCopy}
        />
      </div>
    </div>
  </div>
);

import { useEffect } from 'react';
import { Alert, Button, Input, Select, Spin, Switch } from 'antd';
import { useSetAtom } from 'jotai';
import {
  AlertTriangleIcon,
  BadgeCheckIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CpuIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  LinkIcon,
  Loader2Icon,
  LogInIcon,
  PlugIcon,
  SaveIcon,
  ShieldIcon,
  XCircleIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';
import type { PicoclawRuntimeStatus } from '@/jotai/picoclaw.ts';

import { AUTH_API_KEY, AUTH_NONE, AUTH_OAUTH, useModelConfig } from './use-model-config.ts';

const CUSTOM_MODEL = '__custom__';

type SidebarModelConfigProps = {
  runtimeStatus: PicoclawRuntimeStatus | null;
  onSaved: (status: PicoclawRuntimeStatus | null) => void;
  onCancel?: () => void;
  showCancel?: boolean;
};

function Badge({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: 'ok' | 'warn' | 'bad' | 'muted';
}) {
  const toneClass = {
    ok: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    warn: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    bad: 'border-red-500/30 bg-red-500/10 text-red-300',
    muted: 'border-white/[0.08] bg-white/[0.04] text-neutral-400'
  }[tone];
  return (
    <div className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 ${toneClass}`}>
      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
      <span className="ml-2 truncate text-[11px] font-medium">{value}</span>
    </div>
  );
}

export const SidebarModelConfig = ({
  runtimeStatus,
  onSaved,
  onCancel,
  showCancel = false
}: SidebarModelConfigProps) => {
  const { t } = useTranslation();
  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);

  const m = useModelConfig({ onSaved });

  useEffect(() => {
    setIsKeyboardEnable(false);
    return () => {
      setIsKeyboardEnable(true);
    };
  }, [setIsKeyboardEnable]);

  const authLabel = (method: string) => {
    switch (method) {
      case AUTH_OAUTH:
        return t('picoclaw.model.auth.oauth', 'OAuth / ChatGPT subscription');
      case AUTH_NONE:
        return t('picoclaw.model.auth.none', 'No auth (local endpoint)');
      default:
        return t('picoclaw.model.auth.apiKey', 'API key');
    }
  };

  const errorText = (code: string) => {
    const map: Record<string, string> = {
      model_required: t('picoclaw.model.err.modelRequired', 'Enter a model name.'),
      endpoint_required: t('picoclaw.model.err.endpointRequired', 'A base URL is required for this provider.'),
      key_required: t('picoclaw.model.err.keyRequired', 'An API key is required for API key auth.'),
      oauth_required: t('picoclaw.model.err.oauthRequired', 'Sign in with OAuth before saving.'),
      save_failed: t('picoclaw.model.saveFailed', 'Failed to save model configuration')
    };
    return map[code] || code;
  };

  const testText = () => {
    if (!m.testResult) return null;
    const r = m.testResult;
    const ref = r.log_ref ? ` (ref ${r.log_ref})` : '';
    switch (r.outcome) {
      case 'success':
        return {
          type: 'success' as const,
          msg: t('picoclaw.model.test.success', 'Success — model replied: {{reply}}', {
            reply: r.reply || 'OK'
          })
        };
      case 'auth_error':
        return { type: 'error' as const, msg: t('picoclaw.model.test.auth', 'Authentication failed. Check your API key or OAuth login.') };
      case 'invalid_model':
        return { type: 'error' as const, msg: t('picoclaw.model.test.model', 'Model not found or invalid for this provider.') };
      case 'invalid_endpoint':
        return { type: 'error' as const, msg: t('picoclaw.model.test.endpoint', 'The base URL is invalid or unreachable.') };
      case 'network_error':
        return { type: 'error' as const, msg: t('picoclaw.model.test.network', 'Network error reaching the provider.') };
      case 'parser_error':
        return { type: 'warning' as const, msg: t('picoclaw.model.test.parser', 'Got a response but could not parse the model output (possible streaming/parser issue).') };
      case 'unsupported':
        return { type: 'warning' as const, msg: t('picoclaw.model.test.unsupported', 'The provider rejected an unsupported request or tool type.') };
      case 'oauth_not_testable':
        return { type: 'warning' as const, msg: t('picoclaw.model.test.oauthNotTestable', 'OAuth setups are handled by the PicoClaw runtime and cannot be tested directly from NanoKVM. Start the runtime and send a chat message instead.') };
      case 'not_configured':
        return { type: 'warning' as const, msg: t('picoclaw.model.test.notConfigured', 'No model configured to test.') };
      default:
        return { type: 'error' as const, msg: t('picoclaw.model.test.unknown', 'Unknown error.') + ref };
    }
  };

  if (m.loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spin />
      </div>
    );
  }

  const status = runtimeStatus;
  const providerName = m.currentPreset?.name || status?.provider || '—';
  const presetSelectValue = m.presetModels.includes(m.model) ? m.model : CUSTOM_MODEL;
  const testResultView = testText();
  const oauthUnavailable = m.authMethod === AUTH_OAUTH && m.authStatus && m.authStatus.available === false;
  const oauthLoginUrl = m.loginInfo?.login_url || m.authStatus?.login_url;
  const oauthUserCode = m.loginInfo?.user_code || m.authStatus?.user_code;
  const oauthPending = m.authStatus?.status === 'pending';
  const oauthFailed = m.authStatus?.status === 'failed';

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-8 pt-6">
      {/* Title */}
      <div className="mb-1 text-sm font-semibold text-neutral-100">
        {t('picoclaw.model.configureTitle', 'Configure Model')}
      </div>
      <div className="mb-4 text-xs leading-5 text-neutral-500">
        {t('picoclaw.model.configureDescription', 'Choose a provider, model, and authentication for the PicoClaw runtime.')}
      </div>

      {/* Status badges */}
      <div className="mb-5 grid grid-cols-2 gap-1.5">
        <Badge
          label={t('picoclaw.badge.installed', 'Installed')}
          value={status?.installed ? t('picoclaw.badge.yes', 'Yes') : t('picoclaw.badge.no', 'No')}
          tone={status?.installed ? 'ok' : 'bad'}
        />
        <Badge
          label={t('picoclaw.badge.runtime', 'Runtime')}
          value={status?.ready ? t('picoclaw.badge.ready', 'Ready') : t('picoclaw.badge.notReady', 'Not ready')}
          tone={status?.ready ? 'ok' : 'warn'}
        />
        <Badge
          label={t('picoclaw.badge.model', 'Model')}
          value={status?.model_name || m.config?.model_name || '—'}
          tone={status?.model_configured ? 'ok' : 'warn'}
        />
        <Badge label={t('picoclaw.badge.provider', 'Provider')} value={providerName} tone="muted" />
        <Badge
          label={t('picoclaw.badge.auth', 'Auth')}
          value={status?.auth_method ? authLabel(status.auth_method) : '—'}
          tone="muted"
        />
        <Badge
          label={t('picoclaw.badge.apiKey', 'API key')}
          value={status?.api_key_configured ? t('picoclaw.badge.set', 'Set') : t('picoclaw.badge.missing', 'Missing')}
          tone={status?.api_key_configured ? 'ok' : 'muted'}
        />
        <Badge
          label={t('picoclaw.badge.endpoint', 'Endpoint')}
          value={status?.endpoint_configured ? t('picoclaw.badge.set', 'Set') : t('picoclaw.badge.missing', 'Missing')}
          tone={status?.endpoint_configured ? 'ok' : 'muted'}
        />
        <Badge
          label={t('picoclaw.badge.oauth', 'OAuth')}
          value={
            !status?.oauth_available
              ? t('picoclaw.badge.unavailable', 'Unavailable')
              : status?.oauth_authenticated
                ? t('picoclaw.badge.signedIn', 'Signed in')
                : t('picoclaw.badge.signedOut', 'Signed out')
          }
          tone={status?.oauth_authenticated ? 'ok' : 'muted'}
        />
        <Badge
          label={t('picoclaw.badge.checked', 'Checked')}
          value={status?.checked_at ? new Date(status.checked_at).toLocaleTimeString() : '—'}
          tone="muted"
        />
      </div>

      {/* Documentation Link */}
      <a
        href="https://docs.picoclaw.io/docs/configuration/model-list/#supported-vendors-and-protocols"
        target="_blank"
        rel="noreferrer"
        className="group mb-5 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04]">
            <BookOpenIcon className="text-sky-400" size={14} />
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-300">
              {t('picoclaw.model.docsTitle', 'Configuration Guide')}
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-500">
              {t('picoclaw.model.docsDesc', 'Supported models and protocols')}
            </div>
          </div>
        </div>
        <ExternalLinkIcon size={14} className="text-neutral-500 transition-colors group-hover:text-neutral-300" />
      </a>

      {/* Fields */}
      <div className="space-y-4">
        {/* Provider */}
        <div>
          <label className="mb-1.5 block text-xs text-neutral-500">
            {t('picoclaw.model.provider', 'Provider')}
          </label>
          <Select
            className="w-full"
            value={m.provider || undefined}
            onChange={m.changeProvider}
            options={m.providers.map((p) => ({ value: p.id, label: p.name }))}
            suffixIcon={<CpuIcon size={13} className="text-neutral-500" />}
          />
        </div>

        {/* Auth method */}
        <div>
          <label className="mb-1.5 block text-xs text-neutral-500">
            {t('picoclaw.model.authMethod', 'Authentication')}
          </label>
          <Select
            className="w-full"
            value={m.authMethod}
            onChange={m.changeAuthMethod}
            options={m.authMethods.map((method) => ({ value: method, label: authLabel(method) }))}
            suffixIcon={<ShieldIcon size={13} className="text-neutral-500" />}
          />
          <div className="mt-1 text-[11px] leading-4 text-neutral-500">
            {m.authMethod === AUTH_OAUTH
              ? t('picoclaw.model.auth.oauthHint', 'Uses your ChatGPT/Codex subscription plan limits — not API billing.')
              : m.authMethod === AUTH_NONE
                ? t('picoclaw.model.auth.noneHint', 'No credentials are sent. For local endpoints only.')
                : t('picoclaw.model.auth.apiKeyHint', 'Uses pay-as-you-go API billing for the provider.')}
          </div>
        </div>

        {/* OAuth panel */}
        {m.authMethod === AUTH_OAUTH && (
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
            {oauthUnavailable ? (
              <Alert
                type="warning"
                showIcon
                message={t('picoclaw.model.oauth.unavailableTitle', 'OAuth is unavailable')}
                description={
                  <div className="text-[11px] leading-4">
                    <div>{m.authStatus?.unavailable_reason}</div>
                    {m.authStatus?.missing_command && (
                      <div className="mt-1 font-mono text-neutral-400">
                        {t('picoclaw.model.oauth.missing', 'Missing backend command:')}{' '}
                        {m.authStatus.missing_command}
                      </div>
                    )}
                  </div>
                }
              />
            ) : m.authStatus?.authenticated ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <BadgeCheckIcon size={15} />
                  <span>
                    {t('picoclaw.model.oauth.signedInAs', 'Signed in')}
                    {m.authStatus.account ? `: ${m.authStatus.account}` : ''}
                  </span>
                </div>
                <Button size="small" loading={m.oauthBusy} onClick={() => void m.logoutOAuth()}>
                  {t('picoclaw.model.oauth.signOut', 'Sign out')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-[11px] leading-4 text-neutral-400">
                  {t('picoclaw.model.oauth.headlessHint', 'Start login, then open the URL on another device to authorize. NanoKVM has no browser of its own.')}
                </div>
                <div className="text-[11px] leading-4 text-neutral-500">
                  {t('picoclaw.model.oauth.memoryHint', 'NanoKVM briefly stops only the PicoClaw runtime during login to save memory, then restarts it.')}
                </div>
                <Button
                  icon={<LogInIcon size={13} />}
                  loading={m.oauthBusy}
                  onClick={() => void m.startOAuth()}
                  type="primary"
                  size="small"
                >
                  {t('picoclaw.model.oauth.start', 'Start OAuth Login')}
                </Button>

                {oauthLoginUrl && (
                  <div className="space-y-2 rounded-md border border-white/[0.08] bg-black/30 p-2.5">
                    <div className="text-[11px] text-neutral-400">
                      {t('picoclaw.model.oauth.openUrl', 'Open this URL to sign in:')}
                    </div>
                    <a
                      href={oauthLoginUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-all text-[11px] text-sky-400 hover:underline"
                    >
                      {oauthLoginUrl}
                    </a>
                    {oauthUserCode && (
                      <div className="text-[11px] text-neutral-400">
                        {t('picoclaw.model.oauth.code', 'Code:')}{' '}
                        <span className="font-mono text-neutral-200">{oauthUserCode}</span>
                      </div>
                    )}
                    {oauthPending && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] text-sky-300">
                          <Loader2Icon size={12} className="animate-spin" />
                          {t('picoclaw.model.oauth.waiting', 'Waiting for authorization…')}
                        </span>
                        <Button size="small" type="text" onClick={() => void m.checkAuthStatus()}>
                          {t('picoclaw.model.oauth.checkNow', 'Check now')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {oauthFailed && (
                  <Alert
                    type="error"
                    showIcon
                    message={
                      m.authStatus?.error ||
                      t('picoclaw.model.oauth.failed', 'OAuth login failed. Please try again.')
                    }
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Model */}
        <div>
          <label className="mb-1.5 block text-xs text-neutral-500">
            {t('picoclaw.model.modelIdentifier', 'Model')}
          </label>
          {m.presetModels.length > 0 && (
            <Select
              className="mb-2 w-full"
              value={presetSelectValue}
              onChange={(value) => {
                if (value !== CUSTOM_MODEL) m.setModel(value);
              }}
              options={[
                ...m.presetModels.map((model) => ({ value: model, label: model })),
                { value: CUSTOM_MODEL, label: t('picoclaw.model.custom', 'Custom model…') }
              ]}
            />
          )}
          <Input
            prefix={<CpuIcon size={13} className="text-neutral-500" />}
            placeholder={t('picoclaw.model.modelIdentifierPlaceholder', 'e.g. gemini-3.1-flash-lite')}
            value={m.model}
            onChange={(e) => m.setModel(e.target.value)}
          />
          {m.currentPreset && (
            <div className="mt-1 text-[11px] leading-4 text-neutral-500">
              {m.currentPreset.supports_web_search_preview
                ? t('picoclaw.model.capability.webSearchSupported', 'Built-in web search (web_search_preview) is supported by this provider.')
                : t('picoclaw.model.capability.webSearchUnsupported', 'Built-in web search (web_search_preview) is not available for this provider.')}
            </div>
          )}
        </div>

        {/* API key */}
        {m.authMethod === AUTH_API_KEY && (
          <div>
            <label className="mb-1.5 block text-xs text-neutral-500">
              {t('picoclaw.model.apiKey', 'API Key')}
            </label>
            <Input.Password
              prefix={<KeyRoundIcon size={13} className="text-neutral-500" />}
              placeholder={
                m.apiKeyConfigured
                  ? t('picoclaw.model.apiKeyKeep', '•••••••• (configured — leave blank to keep)')
                  : t('picoclaw.model.apiKeyPlaceholder', 'Enter the model API key')
              }
              value={m.apiKey}
              onChange={(e) => m.setApiKey(e.target.value)}
            />
          </div>
        )}

        {/* Advanced toggle for cloud providers */}
        {m.currentPreset?.endpoint_editable && !m.endpointRequired && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {t('picoclaw.model.advanced', 'Advanced: custom base URL')}
            </span>
            <Switch size="small" checked={m.advanced} onChange={m.setAdvanced} />
          </div>
        )}

        {/* Endpoint */}
        {m.endpointVisible && (
          <div>
            <label className="mb-1.5 block text-xs text-neutral-500">
              {t('picoclaw.model.apiBase', 'API Base URL')}
              {m.endpointRequired && <span className="ml-1 text-red-400">*</span>}
            </label>
            <Input
              prefix={<LinkIcon size={13} className="text-neutral-500" />}
              placeholder={
                m.currentPreset?.default_api_base ||
                t('picoclaw.model.apiBasePlaceholder', 'https://api.example.com/v1')
              }
              value={m.apiBase}
              onChange={(e) => m.setApiBase(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {m.error && (
        <div className="mt-4">
          <Alert type="error" showIcon message={errorText(m.error)} />
        </div>
      )}

      {/* Test result */}
      {testResultView && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] p-2.5">
          {testResultView.type === 'success' ? (
            <CheckCircle2Icon size={15} className="mt-0.5 shrink-0 text-emerald-400" />
          ) : testResultView.type === 'warning' ? (
            <AlertTriangleIcon size={15} className="mt-0.5 shrink-0 text-amber-400" />
          ) : (
            <XCircleIcon size={15} className="mt-0.5 shrink-0 text-red-400" />
          )}
          <span className="text-[11px] leading-4 text-neutral-300">{testResultView.msg}</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between gap-2">
        <Button icon={<PlugIcon size={13} />} loading={m.testing} onClick={() => void m.runTest()}>
          {t('picoclaw.model.test.button', 'Test Model')}
        </Button>
        <div className="flex gap-2">
          {showCancel && onCancel && <Button onClick={onCancel}>{t('picoclaw.cancel', 'Cancel')}</Button>}
          <Button
            icon={<SaveIcon size={13} />}
            loading={m.saving}
            onClick={() => void m.save()}
            type="primary"
          >
            {t(m.saving ? 'picoclaw.model.saving' : 'picoclaw.model.save', m.saving ? 'Saving' : 'Save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

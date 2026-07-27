import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getPicoclawAuthStatus,
  getPicoclawModelConfig,
  picoclawAuthCallback,
  picoclawAuthLogout,
  setPicoclawModelConfig,
  startPicoclawAuthLogin,
  testPicoclawModel,
  type ModelConfigRequest,
  type ModelTestRequest
} from '@/api/picoclaw.ts';
import type {
  PicoclawAuthLogin,
  PicoclawAuthStatus,
  PicoclawModelConfig,
  PicoclawModelTestResult,
  PicoclawProviderPreset,
  PicoclawRuntimeStatus
} from '@/jotai/picoclaw.ts';

export const AUTH_API_KEY = 'api_key';
export const AUTH_OAUTH = 'oauth';
export const AUTH_NONE = 'none';

type UseModelConfigOptions = {
  onSaved: (status: PicoclawRuntimeStatus | null) => void;
};

function isOk(response: { code: number }) {
  return response.code === 0;
}

function errorMessage(response: unknown, fallback: string) {
  const value = response as { message?: string; msg?: string } | undefined;
  return value?.message || value?.msg || fallback;
}

export function useModelConfig({ onSaved }: UseModelConfigOptions) {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<PicoclawProviderPreset[]>([]);
  const [config, setConfig] = useState<PicoclawModelConfig | null>(null);

  const [provider, setProvider] = useState('');
  const [authMethod, setAuthMethod] = useState(AUTH_API_KEY);
  const [model, setModel] = useState('');
  const [apiBase, setApiBase] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [advanced, setAdvanced] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<PicoclawModelTestResult | null>(null);

  const [authStatus, setAuthStatus] = useState<PicoclawAuthStatus | null>(null);
  const [loginInfo, setLoginInfo] = useState<PicoclawAuthLogin | null>(null);
  const [deviceCode, setDeviceCode] = useState('');
  const [oauthBusy, setOauthBusy] = useState(false);

  const currentPreset = useMemo(
    () => providers.find((item) => item.id === provider),
    [providers, provider]
  );

  const refreshAuthStatus = useCallback(async (target: string) => {
    try {
      const response = await getPicoclawAuthStatus(target);
      if (isOk(response)) {
        setAuthStatus(response.data as PicoclawAuthStatus);
      }
    } catch {
      // status badge falls back to "unknown"; non-fatal
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await getPicoclawModelConfig();
        if (!active || !isOk(response)) {
          return;
        }
        const cfg = response.data as PicoclawModelConfig;
        setConfig(cfg);
        setProviders(cfg.providers || []);

        const initialProvider = cfg.provider || cfg.providers?.[0]?.id || 'openai';
        const preset = cfg.providers?.find((item) => item.id === initialProvider);
        const initialAuth = cfg.auth_method || preset?.auth_methods?.[0] || AUTH_API_KEY;

        setProvider(initialProvider);
        setAuthMethod(initialAuth);
        setModel(cfg.model_name || '');
        setApiBase(cfg.api_base || '');

        if (initialAuth === AUTH_OAUTH) {
          void refreshAuthStatus(initialProvider);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshAuthStatus]);

  // Poll while a device-code login is pending so the badge flips to
  // authenticated once the user authorizes in their browser.
  useEffect(() => {
    if (authMethod !== AUTH_OAUTH || authStatus?.status !== 'pending') {
      return;
    }
    const id = setInterval(() => {
      void refreshAuthStatus(provider);
    }, 4000);
    return () => clearInterval(id);
  }, [authMethod, authStatus?.status, provider, refreshAuthStatus]);

  const checkAuthStatus = useCallback(
    () => refreshAuthStatus(provider),
    [provider, refreshAuthStatus]
  );

  const changeProvider = useCallback(
    (next: string) => {
      const preset = providers.find((item) => item.id === next);
      const methods = preset?.auth_methods?.length ? preset.auth_methods : [AUTH_API_KEY];
      setProvider(next);
      setAuthMethod(methods[0]);
      setModel('');
      setApiKey('');
      setError('');
      setTestResult(null);
      setLoginInfo(null);
      setApiBase(preset?.endpoint_required ? preset.default_api_base || '' : '');
      if (methods[0] === AUTH_OAUTH) {
        void refreshAuthStatus(next);
      }
    },
    [providers, refreshAuthStatus]
  );

  const changeAuthMethod = useCallback(
    (next: string) => {
      setAuthMethod(next);
      setError('');
      setTestResult(null);
      if (next === AUTH_OAUTH) {
        void refreshAuthStatus(provider);
      }
    },
    [provider, refreshAuthStatus]
  );

  const startOAuth = useCallback(async () => {
    setOauthBusy(true);
    setError('');
    try {
      const response = await startPicoclawAuthLogin(provider);
      if (isOk(response)) {
        setLoginInfo(response.data as PicoclawAuthLogin);
      } else {
        setError(errorMessage(response, 'OAuth login could not be started'));
      }
      await refreshAuthStatus(provider);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'OAuth login could not be started');
    } finally {
      setOauthBusy(false);
    }
  }, [provider, refreshAuthStatus]);

  const submitOAuthCode = useCallback(async () => {
    setOauthBusy(true);
    setError('');
    try {
      const response = await picoclawAuthCallback({
        provider,
        code: deviceCode.trim(),
        state: loginInfo?.state
      });
      if (!isOk(response)) {
        setError(errorMessage(response, 'OAuth verification failed'));
      } else {
        setLoginInfo(null);
        setDeviceCode('');
      }
      await refreshAuthStatus(provider);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'OAuth verification failed');
    } finally {
      setOauthBusy(false);
    }
  }, [provider, deviceCode, loginInfo, refreshAuthStatus]);

  const logoutOAuth = useCallback(async () => {
    setOauthBusy(true);
    try {
      await picoclawAuthLogout(provider);
      setLoginInfo(null);
      await refreshAuthStatus(provider);
    } catch {
      // non-fatal
    } finally {
      setOauthBusy(false);
    }
  }, [provider, refreshAuthStatus]);

  const buildPayload = useCallback((): ModelConfigRequest & ModelTestRequest => {
    const payload: ModelConfigRequest & ModelTestRequest = {
      provider,
      model: model.trim(),
      auth_method: authMethod
    };
    if (apiBase.trim()) {
      payload.api_base = apiBase.trim();
    }
    if (authMethod === AUTH_API_KEY && apiKey.trim()) {
      payload.api_key = apiKey.trim();
    }
    return payload;
  }, [provider, model, authMethod, apiBase, apiKey]);

  const validate = useCallback((): string => {
    if (!model.trim()) {
      return 'model_required';
    }
    const needsEndpoint = currentPreset?.endpoint_required;
    if (needsEndpoint && !apiBase.trim() && !currentPreset?.default_api_base) {
      return 'endpoint_required';
    }
    if (authMethod === AUTH_API_KEY) {
      const keptKey =
        Boolean(config?.api_key_configured) && model.trim() === (config?.model_name || '');
      if (!apiKey.trim() && !keptKey) {
        return 'key_required';
      }
    }
    if (authMethod === AUTH_OAUTH && !authStatus?.authenticated) {
      return 'oauth_required';
    }
    return '';
  }, [model, currentPreset, apiBase, authMethod, apiKey, config, authStatus]);

  const save = useCallback(async () => {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await setPicoclawModelConfig(buildPayload());
      if (isOk(response)) {
        onSaved((response.data?.status as PicoclawRuntimeStatus) ?? null);
        return;
      }
      setError(errorMessage(response, 'save_failed'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'save_failed');
    } finally {
      setSaving(false);
    }
  }, [validate, buildPayload, onSaved]);

  const runTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await testPicoclawModel(buildPayload());
      if (isOk(response)) {
        setTestResult(response.data as PicoclawModelTestResult);
      } else {
        setTestResult({ ok: false, outcome: 'unknown' });
      }
    } catch {
      setTestResult({ ok: false, outcome: 'network_error' });
    } finally {
      setTesting(false);
    }
  }, [buildPayload]);

  const endpointRequired = Boolean(currentPreset?.endpoint_required);
  const endpointEditable = Boolean(currentPreset?.endpoint_editable);
  const endpointVisible = endpointEditable && (endpointRequired || advanced);

  return {
    loading,
    providers,
    config,
    provider,
    authMethod,
    model,
    apiBase,
    apiKey,
    advanced,
    saving,
    error,
    testing,
    testResult,
    authStatus,
    loginInfo,
    deviceCode,
    oauthBusy,
    currentPreset,
    presetModels: currentPreset?.models ?? [],
    authMethods: currentPreset?.auth_methods ?? [AUTH_API_KEY],
    endpointRequired,
    endpointVisible,
    apiKeyConfigured: Boolean(config?.api_key_configured),
    setModel,
    setApiBase,
    setApiKey,
    setDeviceCode,
    setAdvanced,
    setError,
    changeProvider,
    changeAuthMethod,
    startOAuth,
    submitOAuthCode,
    logoutOAuth,
    checkAuthStatus,
    save,
    runTest
  };
}

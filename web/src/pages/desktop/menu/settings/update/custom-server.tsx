import { useEffect, useState } from 'react';
import { Button, Input, message, Modal, Switch } from 'antd';
import { TriangleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/application.ts';

const OFFICIAL_UPDATE_SERVER = 'https://cdn.sipeed.com/nanokvm';

interface CustomServerProps {
  checkForUpdates: () => void;
  onEnabledChange: (enabled: boolean) => void;
  onPendingChange: (pending: boolean) => void;
}

export const CustomServer = ({
  checkForUpdates,
  onEnabledChange,
  onPendingChange
}: CustomServerProps) => {
  const { t } = useTranslation();

  const [savedConfig, setSavedConfig] = useState<api.UpdateServerConfig>({
    enabled: false,
    url: OFFICIAL_UPDATE_SERVER
  });
  const [enabled, setEnabled] = useState(false);
  const [url, setUrl] = useState(OFFICIAL_UPDATE_SERVER);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getUpdateServer()
      .then((rsp) => {
        if (rsp.code !== 0 || !rsp.data) {
          message.error(t('settings.update.customServer.loadFailed'));
          return;
        }

        const config = rsp.data as api.UpdateServerConfig;
        setSavedConfig(config);
        setEnabled(config.enabled);
        setUrl(config.url || OFFICIAL_UPDATE_SERVER);
        onEnabledChange(config.enabled);
      })
      .catch(() => message.error(t('settings.update.customServer.loadFailed')))
      .finally(() => setIsLoading(false));
  }, [onEnabledChange, t]);

  function validateURL(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return t('settings.update.customServer.invalidUrl');

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return t('settings.update.customServer.invalidUrl');
      }
      if (
        parsed.search ||
        parsed.hash ||
        parsed.pathname.replace(/\/+$/, '').endsWith('/latest.json')
      ) {
        return t('settings.update.customServer.invalidUrl');
      }
    } catch {
      return t('settings.update.customServer.invalidUrl');
    }

    return '';
  }

  function requestEnable(nextEnabled: boolean) {
    if (isLoading || isSaving) return;

    if (nextEnabled) {
      setIsConfirmOpen(true);
      return;
    }

    if (!savedConfig.enabled) {
      setEnabled(false);
      setError('');
      onEnabledChange(false);
      return;
    }

    saveConfig({ enabled: false, url: savedConfig.url });
  }

  function requestSave() {
    if (isSaving) return;

    const validationError = validateURL(url);
    setError(validationError);
    if (validationError) return;

    saveConfig({ enabled: true, url: url.trim() });
  }

  function confirmRisk() {
    setEnabled(true);
    setError('');
    setIsConfirmOpen(false);
  }

  function saveConfig(config: api.UpdateServerConfig) {
    setIsSaving(true);
    let savedSuccessfully = false;
    api
      .setUpdateServer(config)
      .then((rsp) => {
        if (rsp.code !== 0 || !rsp.data) {
          message.error(rsp.msg || t('settings.update.customServer.saveFailed'));
          return;
        }

        const saved = rsp.data as api.UpdateServerConfig;
        savedSuccessfully = true;
        setSavedConfig(saved);
        setEnabled(saved.enabled);
        setUrl(saved.url);
        setError('');
        onEnabledChange(saved.enabled);
        message.success(t('settings.update.customServer.saved'));
        checkForUpdates();
      })
      .catch(() => message.error(t('settings.update.customServer.saveFailed')))
      .finally(() => {
        if (!savedSuccessfully) {
          setEnabled(savedConfig.enabled);
          onEnabledChange(savedConfig.enabled);
        }
        setIsSaving(false);
        setIsConfirmOpen(false);
      });
  }

  const hasChanges = enabled !== savedConfig.enabled || url.trim() !== savedConfig.url;

  useEffect(() => {
    onPendingChange(hasChanges);
  }, [hasChanges, onPendingChange]);

  const modalTitle = (
    <div className="flex items-center space-x-1 text-red-500">
      <TriangleAlertIcon size={18} />
      <span>{t('settings.update.customServer.confirmTitle')}</span>
    </div>
  );

  return (
    <>
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div>{t('settings.update.customServer.title')}</div>
            <div className="text-xs text-neutral-500">{t('settings.update.customServer.desc')}</div>
          </div>
          <Switch
            className="shrink-0"
            checked={enabled}
            loading={isLoading || isSaving}
            disabled={isLoading || isSaving}
            onChange={requestEnable}
          />
        </div>

        {enabled && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="min-w-0 flex-1">
                <Input
                  value={url}
                  status={error ? 'error' : undefined}
                  disabled={isSaving}
                  placeholder={OFFICIAL_UPDATE_SERVER}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    setError('');
                  }}
                  onPressEnter={requestSave}
                />
                {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
              </div>
              <Button
                className="shrink-0"
                type="primary"
                loading={isSaving}
                disabled={!hasChanges || isLoading}
                onClick={requestSave}
              >
                {t('settings.update.customServer.save')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        title={modalTitle}
        open={isConfirmOpen}
        centered
        okType="danger"
        okText={t('settings.update.customServer.confirm')}
        cancelText={t('settings.update.cancel')}
        confirmLoading={isSaving}
        onOk={confirmRisk}
        onCancel={() => setIsConfirmOpen(false)}
      >
        <div className="space-y-4 py-5">
          <p>{t('settings.update.customServer.confirmDesc')}</p>
          <div className="break-all rounded bg-neutral-800 p-3 font-mono text-sm">
            {url || OFFICIAL_UPDATE_SERVER}
          </div>
        </div>
      </Modal>
    </>
  );
};

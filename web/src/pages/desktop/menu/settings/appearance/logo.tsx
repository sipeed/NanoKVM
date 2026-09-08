import { useRef, useState } from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';

export const Logo = () => {
  const { t } = useTranslation();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'' | 'uploading' | 'uploaded' | 'error'>('');
  const [msg, setMsg] = useState('');

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || status === 'uploading') return;

    setStatus('uploading');
    setMsg('');
    api
      .setLogo(file)
      .then((rsp) => {
        if (rsp.code !== 0) {
          setStatus('error');
          setMsg(rsp.msg);
          return;
        }
        setStatus('uploaded');
        refreshPreview();
      })
      .catch(() => {
        setStatus('error');
        setMsg(t('settings.appearance.logo.uploadFailed'));
      });
  }

  function reset() {
    if (status === 'uploading') return;
    setStatus('uploading');
    setMsg('');
    api
      .resetLogo()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setStatus('error');
          setMsg(rsp.msg);
          return;
        }
        setStatus('uploaded');
        refreshPreview();
      })
      .catch(() => {
        setStatus('error');
        setMsg(t('settings.appearance.logo.resetFailed'));
      });
  }

  function refreshPreview() {
    const img = document.getElementById('logo-preview') as HTMLImageElement | null;
    if (img) {
      img.src = `/sipeed.ico?t=${Date.now()}`;
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('settings.appearance.logo.title')}</span>
          <span className="text-xs text-neutral-500">{t('settings.appearance.logo.description')}</span>
        </div>

        <div className="flex items-center space-x-3">
          <img id="logo-preview" src="/sipeed.ico" alt="logo" className="size-8 rounded" />
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/svg+xml,image/x-icon,.ico"
            className="hidden"
            onChange={onFileChange}
          />
          <Button size="small" loading={status === 'uploading'} onClick={() => logoInputRef.current?.click()}>
            {t('settings.appearance.logo.upload')}
          </Button>
          <Button size="small" onClick={reset}>
            {t('settings.appearance.logo.reset')}
          </Button>
        </div>
      </div>

      {status === 'uploaded' && (
        <div className="flex w-full justify-end text-xs text-green-500">{t('settings.appearance.logo.saved')}</div>
      )}
      {status === 'error' && <div className="flex w-full justify-end text-xs text-red-500">{msg}</div>}
    </div>
  );
};

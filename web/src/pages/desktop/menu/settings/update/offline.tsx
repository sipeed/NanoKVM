import { useRef, useState } from 'react';
import { Button, Input } from 'antd';
import { ExternalLinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/application.ts';

interface UpdateProps {
  status: string;
  setStatus: (status: string) => void;
  setIsLocked: (isClosable: boolean) => void;
  setErrMsg: (msg: string) => void;
}

export const Offline = ({ status, setStatus, setIsLocked, setErrMsg }: UpdateProps) => {
  const { t } = useTranslation();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [sha256Checksum, setSha256Checksum] = useState('');

  function handleClick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    e.target.value = '';

    if (!validateFilename(file.name)) {
      setStatus('failed');
      setErrMsg(t('settings.update.offline.invalidName'));
      return;
    }

    upload(file);
  }

  function upload(file: File | null) {
    if (!file) return;

    const checksum = sha256Checksum.trim();
    if (checksum && !/^[a-fA-F0-9]{64}$/.test(checksum)) {
      setStatus('failed');
      setErrMsg(t('settings.update.offline.invalidChecksum'));
      return;
    }

    if (!validateFilename(file.name)) {
      setStatus('failed');
      setErrMsg(t('settings.update.offline.invalidName'));
      return;
    }

    if (status === 'loading' || status === 'updating') {
      return;
    }

    setIsLocked(true);
    setStatus('updating');
    setErrMsg('');

    const formData = new FormData();
    formData.append('file', file);

    api
      .offlineUpdate(formData, checksum)
      .then((rsp: Response) => {
        if (!rsp.ok) throw new Error(`HTTP error ${rsp.status}`);
        return rsp.json();
      })
      .then((rspj: any) => {
        if (rspj.code !== 0) {
          const message = rspj.msg?.includes('sha256 checksum mismatch')
            ? t('settings.update.offline.checksumMismatch')
            : rspj.msg || t('settings.update.offline.updateFailed');
          throw new Error(message);
        }

        setTimeout(() => {
          setIsLocked(false);
          window.location.reload();
        }, 12000);
      })
      .catch((error: unknown) => {
        setIsLocked(false);
        setStatus('failed');
        setErrMsg(
          error instanceof Error ? error.message : t('settings.update.offline.updateFailed')
        );
      });
  }

  function validateFilename(filename: string) {
    const regex: RegExp = /^nanokvm_\d+\.\d+\.\d+\.tar\.gz$/;
    return regex.test(filename);
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span>{t('settings.update.offline.title')}</span>

              <a
                className="flex items-center text-neutral-500 hover:text-blue-500"
                href="https://github.com/sipeed/NanoKVM/releases"
                target="_blank"
              >
                <ExternalLinkIcon size={15} />
              </a>
            </div>

            <span className="text-xs text-neutral-500">{t('settings.update.offline.desc')}</span>
          </div>

          <input
            id="file-upload"
            ref={inputRef}
            type="file"
            accept=".tar.gz"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button disabled={status === 'loading' || status === 'updating'} onClick={handleClick}>
            {t('settings.update.offline.upload')}
          </Button>
        </div>

        <Input
          value={sha256Checksum}
          maxLength={64}
          disabled={status === 'updating'}
          placeholder={t('settings.update.offline.checksumPlaceholder')}
          onChange={(event) => setSha256Checksum(event.target.value)}
        />
      </div>
    </>
  );
};

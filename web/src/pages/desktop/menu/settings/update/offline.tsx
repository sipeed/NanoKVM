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
  onRestarting: () => void;
}

export const Offline = ({ status, setStatus, setIsLocked, setErrMsg, onRestarting }: UpdateProps) => {
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

  function isExpectedRestartDisconnect(error: unknown) {
    if (error instanceof TypeError) return true;
    if (error instanceof DOMException) {
      return error.name === 'NetworkError' || error.name === 'AbortError';
    }
    return error instanceof Error && /network|load failed|connection.*lost/i.test(error.message);
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

    if (status === 'loading' || status === 'updating' || status === 'restarting') {
      return;
    }

    setIsLocked(true);
    setStatus('updating');
    setErrMsg('');

    const formData = new FormData();
    formData.append('file', file);

    api
      .offlineUpdate(formData, checksum)
      .then(async (rsp: Response) => {
        // The proxy may return 502 after the update stops the old server.
        if (rsp.status === 502) return;
        if (!rsp.ok) throw new Error(`HTTP error ${rsp.status}`);

        let rspj: any;
        try {
          rspj = await rsp.json();
        } catch {
          // A successful response with a truncated body means the updater has
          // already stopped the old service; continue to the restart screen.
          return;
        }
        if (rspj.code !== 0) {
          const message = rspj.msg?.includes('sha256 checksum mismatch')
            ? t('settings.update.offline.checksumMismatch')
            : rspj.msg || t('settings.update.offline.updateFailed');
          throw new Error(message);
        }
      })
      .then(onRestarting)
      .catch((error: unknown) => {
        // The updater may close the old HTTP server before fetch receives its
        // response. A network-level TypeError after upload is therefore the
        // expected reboot path, not an upload failure.
        if (isExpectedRestartDisconnect(error)) {
          onRestarting();
          return;
        }
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
          <Button
            disabled={status === 'loading' || status === 'updating' || status === 'restarting'}
            onClick={handleClick}
          >
            {t('settings.update.offline.upload')}
          </Button>
        </div>

        <Input
          value={sha256Checksum}
          maxLength={64}
          disabled={status === 'updating' || status === 'restarting'}
          placeholder={t('settings.update.offline.checksumPlaceholder')}
          onChange={(event) => setSha256Checksum(event.target.value)}
        />
      </div>
    </>
  );
};

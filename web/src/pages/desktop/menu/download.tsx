import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Button, Divider, Input } from 'antd';
import type { InputRef } from 'antd';
import clsx from 'clsx';
import { useSetAtom } from 'jotai';
import { DownloadIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cancelDownloadImage, downloadImage, imageEnabled, statusImage } from '@/api/download.ts';
import { keyboardLockAtom } from '@/jotai/keyboard.ts';
import { MenuItem } from '@/components/menu-item.tsx';

const imageUpdatedEvent = 'nanokvm:image-updated';

export const DownloadImage = () => {
  const { t } = useTranslation();
  const setKeyboardLock = useSetAtom(keyboardLockAtom);

  const [input, setInput] = useState('');
  const [sha256sum, setSha256sum] = useState('');
  const [status, setStatus] = useState('');
  const [log, setLog] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRemoteDownloading, setIsRemoteDownloading] = useState(false);
  const [diskEnabled, setDiskEnabled] = useState(false);
  const [popoverKey, setPopoverKey] = useState(0);

  const inputRef = useRef<InputRef>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const intervalId = useRef<NodeJS.Timeout | undefined>(undefined);
  const pollingGeneration = useRef(0);
  const remoteDownloadActive = useRef(false);
  const fileUploadActive = useRef(false);
  const downloadRequestGeneration = useRef(0);

  useEffect(() => {
    checkDiskEnabled();
  }, []);

  function checkDiskEnabled() {
    imageEnabled()
      .then((res) => {
        setDiskEnabled(res.data.enabled);
      })
      .catch(() => {
        setDiskEnabled(false);
      });
  }

  function handleOpenChange(open: boolean) {
    if (open) {
      checkDiskEnabled();
      startStatusPolling();
      setKeyboardLock({ source: 'download-popover', locked: true });
      setPopoverKey((prevKey) => prevKey + 1); // Force re-render
    } else {
      setKeyboardLock({ source: 'download-popover', locked: false });

      // Keep monitoring an active remote download after the popover closes so
      // completion can still refresh an already-open image list.
      if (!remoteDownloadActive.current) {
        setInput('');
        setSha256sum('');
        setStatus('');
        setLog('');
        setIsCancelling(false);
        setIsRemoteDownloading(false);
        stopStatusPolling();
      }
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
  }

  function handleSha256Change(e: ChangeEvent<HTMLInputElement>) {
    setSha256sum(e.target.value);
  }

  function getValidatedSHA256() {
    const checksum = sha256sum.trim();
    if (checksum && !/^[a-fA-F0-9]{64}$/.test(checksum)) {
      setStatus('failed');
      setLog(t('download.invalidSHA256'));
      return null;
    }

    return checksum;
  }

  function startStatusPolling() {
    stopStatusPolling();
    const generation = pollingGeneration.current;
    getDownloadStatus(generation);
    intervalId.current = setInterval(() => getDownloadStatus(generation), 2500);
  }

  function stopStatusPolling() {
    pollingGeneration.current += 1;
    clearInterval(intervalId.current);
    intervalId.current = undefined;
  }

  function finishImageTransfer(refreshImages: boolean) {
    stopStatusPolling();
    remoteDownloadActive.current = false;
    fileUploadActive.current = false;
    setIsRemoteDownloading(false);
    setStatus('success');
    setLog(t('download.success'));

    if (refreshImages) {
      window.dispatchEvent(new Event(imageUpdatedEvent));
    }
  }

  function getDownloadStatus(generation = pollingGeneration.current) {
    statusImage().then((rsp) => {
      // Ignore a response from a previous polling session. This can happen when
      // a download is started while the initial status request is still pending.
      if (generation !== pollingGeneration.current) return;

      if (rsp.data.status) {
        setStatus(rsp.data.status);
        if (rsp.data.status === 'in_progress') {
          const isRemoteDownload = /^https?:\/\//.test(rsp.data.file);
          remoteDownloadActive.current = isRemoteDownload;
          setIsRemoteDownloading(isRemoteDownload);
          // Check if rsp has a percentage value
          if (rsp.data.percentage) {
            setLog('Downloading (' + rsp.data.percentage + ')' + ': ' + rsp.data.file);
          } else {
            setLog('Downloading' + ': ' + rsp.data.file);
          }
          setInput(rsp.data.file);
        }
        if (rsp.data.status === 'checksum_failed') {
          remoteDownloadActive.current = false;
          setIsRemoteDownloading(false);
          setLog(t('download.checksumFailed'));
          stopStatusPolling();
        }
        if (rsp.data.status === 'failed') {
          remoteDownloadActive.current = false;
          setIsRemoteDownloading(false);
          setLog(t('download.failed'));
          stopStatusPolling();
        }
        if (rsp.data.status === 'success') {
          const completedRemoteDownload = remoteDownloadActive.current;
          finishImageTransfer(completedRemoteDownload);
        }
        if (rsp.data.status === 'idle') {
          if (fileUploadActive.current) return;

          remoteDownloadActive.current = false;
          setIsRemoteDownloading(false);
          setLog('');
          stopStatusPolling();
        }
      }
    });
  }

  function download(url?: string) {
    if (!url) return;

    const checksum = getValidatedSHA256();
    if (checksum === null) return;

    // Invalidate the status request started when the popover was opened.
    // Start polling only after the download request has created the server-side
    // download state, otherwise the first response can still be `idle`.
    stopStatusPolling();
    const requestGeneration = ++downloadRequestGeneration.current;
    remoteDownloadActive.current = true;
    setIsRemoteDownloading(true);
    setStatus('in_progress');
    setLog('Downloading: ' + url);

    downloadImage(url, checksum)
      .then((rsp) => {
        if (requestGeneration !== downloadRequestGeneration.current) return;

        if (rsp.code !== 0) {
          stopStatusPolling();
          remoteDownloadActive.current = false;
          setIsRemoteDownloading(false);
          setStatus('failed');
          setLog(rsp.msg || t('download.failed'));
          return;
        }

        startStatusPolling();
      })
      .catch(() => {
        if (requestGeneration !== downloadRequestGeneration.current) return;

        stopStatusPolling();
        remoteDownloadActive.current = false;
        setIsRemoteDownloading(false);
        setStatus('failed');
        setLog(t('download.failed'));
      });
  }

  function cancelDownload() {
    if (isCancelling) return;

    downloadRequestGeneration.current += 1;
    setIsCancelling(true);
    cancelDownloadImage()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setLog(rsp.msg || t('download.cancelFailed'));
          if (remoteDownloadActive.current) {
            startStatusPolling();
          }
          return;
        }

        stopStatusPolling();
        remoteDownloadActive.current = false;
        setIsRemoteDownloading(false);
        setStatus('idle');
        setLog('');
      })
      .catch(() => {
        setLog(t('download.cancelFailed'));
      })
      .finally(() => {
        setIsCancelling(false);
      });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file || !file.name.toLowerCase().endsWith('.iso')) {
      setStatus('failed');
      setLog(t('download.NoISO'));
      return;
    }
    setIsRemoteDownloading(false);
    remoteDownloadActive.current = false;
    setStatus('idle');
    setLog('');
    setSelectedFile(file);
    stopStatusPolling();
  }

  function upload(file: File | null) {
    if (!file) return;

    if (!file || !file.name.toLowerCase().endsWith('.iso')) {
      setStatus('failed');
      setLog(t('download.NoISO'));
      return;
    }

    const checksum = getValidatedSHA256();
    if (checksum === null) return;

    setStatus('in_progress');
    remoteDownloadActive.current = false;
    fileUploadActive.current = true;
    setIsRemoteDownloading(false);
    setLog('Downloading: ' + file.name);

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/download/file', {
      method: 'POST',
      headers: {
        'X-SHA256-Sum': checksum
      },
      body: formData
    })
      .then(async (response) => {
        const rsp = await response.json();
        if (!response.ok || rsp.code !== 0) {
          const message = rsp.msg === 'sha256 mismatch' ? t('download.checksumFailed') : rsp.msg;
          throw new Error(message || t('download.failed'));
        }

        finishImageTransfer(true);
        setSelectedFile(null);
      })
      .catch((error: unknown) => {
        fileUploadActive.current = false;
        stopStatusPolling();
        setStatus('failed');
        setLog(error instanceof Error ? error.message : t('download.failed'));
      });

    startStatusPolling();
  }

  const content = (
    <div key={popoverKey} className="min-w-[300px]">
      <div className="flex items-center justify-between px-1">
        <span className="text-base font-bold text-neutral-300">{t('download.title')}</span>
      </div>

      <Divider style={{ margin: '10px 0 10px 0' }} />

      {!diskEnabled ? (
        <div className="text-red-500">{t('download.disabled')}</div>
      ) : (
        <div className="space-y-2">
          <div>
            <div className="mb-1 text-neutral-500">{t('download.input')}</div>
            <div className="flex items-center gap-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleChange}
                disabled={status === 'in_progress'}
                className="min-w-0 flex-1"
              />
              <Button
                type="primary"
                className="h-10 w-16 shrink-0 px-0"
                danger={isRemoteDownloading && status === 'in_progress'}
                onClick={() =>
                  isRemoteDownloading && status === 'in_progress'
                    ? cancelDownload()
                    : download(input)
                }
                disabled={isCancelling || (status === 'in_progress' && !isRemoteDownloading)}
              >
                {isRemoteDownloading && status === 'in_progress'
                  ? t('download.cancel')
                  : t('download.ok')}
              </Button>
            </div>
          </div>
          <div>
            <div className="mb-1 text-neutral-500">{t('download.sha256')}</div>
            <Input
              value={sha256sum}
              onChange={handleSha256Change}
              disabled={status === 'in_progress'}
              maxLength={64}
              placeholder={t('download.sha256Placeholder')}
            />
          </div>
          <div>
            <div className="mb-1 text-neutral-500">{t('download.inputfile')}</div>
            <div className="flex items-center gap-1">
              <div
                className={clsx(
                  'flex h-10 min-w-0 flex-1 flex-col items-center justify-center rounded-xl border-2 border-solid transition',
                  isDragging ? 'border-blue-500 bg-neutral-500' : 'border-neutral-600',
                  status === 'in_progress'
                    ? 'cursor-not-allowed bg-neutral-700 opacity-50'
                    : 'cursor-pointer hover:bg-neutral-500'
                )}
                onDrop={(e) => {
                  if (status === 'in_progress') return; // deaktiviert
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0] ?? null;
                  if (!file || !file.name.toLowerCase().endsWith('.iso')) {
                    setStatus('failed');
                    setLog(t('download.NoISO'));
                    return;
                  }
                  setStatus('idle');
                  setLog('');
                  setSelectedFile(file);
                }}
                onDragOver={(e) => {
                  if (status === 'in_progress') return; // deaktiviert
                  e.preventDefault();
                  setIsDragging(true); // Datei wird über den Bereich gezogen
                }}
                onDragLeave={(e) => {
                  if (status === 'in_progress') return; // deaktiviert
                  e.preventDefault();
                  setIsDragging(false); // Maus verlässt Bereich
                }}
                onClick={() => {
                  if (status === 'in_progress') return; // deaktiviert
                  document.getElementById('file-upload')?.click();
                }}
              >
                <span className="w-full truncate px-2 text-center text-sm text-neutral-100">
                  {selectedFile ? selectedFile.name : t('download.uploadbox')}
                </span>

                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  disabled={status === 'in_progress'}
                  className="hidden"
                />
              </div>
              <Button
                type="primary"
                className="h-10 w-16 shrink-0 border-2 px-0"
                onClick={() => upload(selectedFile)}
                disabled={status === 'in_progress' || !selectedFile}
              >
                {t('download.ok')}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className={clsx('min-h-8 pt-2')}>
        {status && (
          <div
            className={clsx(
              'max-w-[300px] break-words text-sm',
              status === 'failed' || status === 'checksum_failed'
                ? 'text-red-500'
                : 'text-green-500'
            )}
          >
            {log}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MenuItem
      title={t('download.title')}
      icon={<DownloadIcon size={18} />}
      content={content}
      onOpenChange={handleOpenChange}
    />
  );
};

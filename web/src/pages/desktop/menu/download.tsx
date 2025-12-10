import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Button, Divider, Input } from 'antd';
import type { InputRef } from 'antd';
import clsx from 'clsx';
import { useSetAtom } from 'jotai';
import { DownloadIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { downloadImage, imageEnabled, statusImage } from '@/api/download.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';
import { MenuItem } from '@/components/menu-item.tsx';

export const DownloadImage = () => {
  const { t } = useTranslation();
  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);

  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const [log, setLog] = useState('');
  const [diskEnabled, setDiskEnabled] = useState(false);
  const [popoverKey, setPopoverKey] = useState(0);

  const inputRef = useRef<InputRef>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const intervalId = useRef<NodeJS.Timeout | undefined>(undefined);

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
      clearInterval(intervalId.current);
      checkDiskEnabled();
      getDownloadStatus();
      if (!intervalId.current) {
        intervalId.current = setInterval(getDownloadStatus, 2500);
      }
      setIsKeyboardEnable(false);
      setPopoverKey((prevKey) => prevKey + 1); // Force re-render
    } else {
      setInput('');
      setStatus('');
      setLog('');

      setIsKeyboardEnable(true);
      clearInterval(intervalId.current);
      intervalId.current = undefined;
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
  }

  function getDownloadStatus() {
    statusImage().then((rsp) => {
      if (rsp.data.status) {
        setStatus(rsp.data.status);
        if (rsp.data.status === 'in_progress') {
          // Check if rsp has a percentage value
          if (rsp.data.percentage) {
            setLog('Downloading (' + rsp.data.percentage + ')' + ': ' + rsp.data.file);
          } else {
            setLog('Downloading' + ': ' + rsp.data.file);
          }
          setInput(rsp.data.file);
        }
        if (rsp.data.status === 'failed') {
          setLog('Failed');
          clearInterval(intervalId.current);
        }
        if (rsp.data.status === 'idle') {
          setLog(''); // Clear the log
          clearInterval(intervalId.current);
        }
      }
    });
  }

  function download(url?: string) {
    if (!url) return;

    setStatus('in_progress');
    setLog('Downloading: ' + url);
    // start the getDownloadStatus to tick every 5 seconds

    downloadImage(url)
      .then(() => {
        getDownloadStatus();
        // Start the interval to check the download status
        if (!intervalId.current) {
          intervalId.current = setInterval(getDownloadStatus, 2500);
        }
      })
      .catch(() => {
        clearInterval(intervalId.current); // Clear the interval when the download is complete or fails
        setStatus('failed');
        setLog('Failed');
      });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
    clearInterval(intervalId.current);
    intervalId.current = undefined;
  }

  function upload(file: File | null) {
    if (!file) return;

    setStatus('in_progress');
    setLog('Downloading: ' + file.name);

    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/download/file", {
      method: "POST",
      body: formData,
    }).catch(() => {
        clearInterval(intervalId.current); // Clear the interval when the download is complete or fails
        setStatus('failed');
        setLog('Failed');
      }).then(() => {
        clearInterval(intervalId.current); // Clear the interval when the download is complete or fails
        setStatus('idle');
        setLog('');
      });

    console.log(intervalId.current);
    // Start the interval to check the download status
    if (!intervalId.current) {
      getDownloadStatus();
      setTimeout(() => {
        intervalId.current = setInterval(getDownloadStatus, 2500);
      }, 2500);
    }
    
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
        <>
          <div>
            <div className="pb-1 text-neutral-500">{t('download.input')}</div>
            <div className="flex items-center space-x-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleChange}
                disabled={status === 'in_progress'}
              />
              <Button
                type="primary"
                onClick={() => download(input)}
                disabled={status === 'in_progress'}
              >
                {t('download.ok')}
              </Button>
            </div>
          </div>
          <div>
            <div className="pb-1 text-neutral-500">{t('upload.input')}</div>
            <div className="flex items-center space-x-1">
              <div
                  className={clsx(
                    "flex flex-col items-center justify-center w-full h-10 border-2 border-solid rounded-xl transition css-9118ya ant-input-outlined",
                    isDragging ? "bg-neutral-500" : "",
                    status === "in_progress" ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer hover:bg-neutral-500"
                  )}
                  style={{
                    ...(isDragging  ? { borderColor: "#1668dc" } : {}),
                    ...(status === "in_progress" ? { backgroundColor: "rgb(255 255 255 / 16%)" } : {}),
                    ...(status === "in_progress" ? { borderColor: "rgb(99 99 99)" } : {}),
                  }}
                  onDrop={(e) => {
                    if (status === "in_progress") return; // deaktiviert
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0] ?? null;
                    setSelectedFile(file);
                  }}
                  onDragOver={(e) => {
                    if (status === "in_progress") return; // deaktiviert
                    e.preventDefault();
                    setIsDragging(true); // Datei wird über den Bereich gezogen
                  }}
                  onDragLeave={(e) => {
                    if (status === "in_progress") return; // deaktiviert
                    e.preventDefault();
                    setIsDragging(false); // Maus verlässt Bereich
                  }}
                  onClick={() => {
                    if (status === "in_progress") return; // deaktiviert
                    document.getElementById("file-upload")?.click()
                  }}
                >
                <span className="text-neutral-100 text-sm p-1">
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
                className="h-10 border-2"
                onClick={() => upload(selectedFile)}
                disabled={status === 'in_progress' || !selectedFile}
              >
                {t('download.ok')}
              </Button>
            </div>
          </div>
        </>
      )}
      <div className={clsx('py-2')}>
        {status && (
          <div
            className={clsx(
              'max-w-[300px] break-words text-sm',
              status === 'failed' ? 'text-red-500' : 'text-green-500'
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

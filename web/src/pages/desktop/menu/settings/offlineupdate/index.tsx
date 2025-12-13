import { useEffect, useState } from 'react';
import { LoadingOutlined, SmileOutlined } from '@ant-design/icons';
import { Button, Input, Result, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import * as api from '@/api/application.ts';

type UpdateProps = {
  setIsLocked: (isClosable: boolean) => void;
};

type Status = '' | 'loading' | 'updating' | 'outdated' | 'latest' | 'latests' | 'failed';

export const OfflineUpdate = ({ setIsLocked }: UpdateProps) => {
  const { t } = useTranslation();

  const [status, setStatus] = useState<Status>('');
  const [currentVersion, setCurrentVersion] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  function checkForUpdates() {
    if (status === 'loading') return;
    setStatus('loading');

    setIsLocked(true);

    api
      .getCurrentVersion()
      .then((rsp: any) => {
        if (rsp.code !== 0 || !rsp.data) {
          setStatus('failed');
          setErrMsg(t('settings.offlineupdate.queryFailed'));
          return;
        }

        setStatus('latest');
        setCurrentVersion(rsp.data.current);
      })
      .catch(() => {
        setStatus('failed');
        setErrMsg(t('settings.offlineupdate.queryFailed'));
      });
      
    setIsLocked(false);
  }
  
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file || !file.name.toLowerCase().endsWith(".tar.gz")) {
      setStatus('failed');
      setErrMsg(t('settings.offlineupdate.noupdatefile'));
      return;
    }
    setSelectedFile(file);
  }
  
  function upload(file: File | null) {
  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".tar.gz")) {
    setStatus('failed');
    setErrMsg(t('settings.offlineupdate.noupdatefile'));
    return;
  }

  setStatus('updating');
  setErrMsg('');

  const formData = new FormData();
  formData.append("file", file);

  fetch("/api/application/uploadupdate", {
    method: "POST",
    body: formData,
  })
    .then((rsp: Response) => {
      // Prüfen ob HTTP OK
      if (!rsp.ok) throw new Error(`HTTP error ${rsp.status}`);
      return rsp.json(); // JSON-Payload parsen
    })
    .then((rspj: any) => {
      // Jetzt rspj ist das tatsächliche JSON
      if (rspj.code !== 0 || !rspj.data) {
        setStatus('failed');
        setErrMsg(rspj.msg || 'Unknown error');
        console.log(rspj);
        return;
      }
      checkForUpdates();
    })
    .catch((err: any) => {
      setStatus('failed');
      setErrMsg(err?.message || 'Failed');
    });
}


  return (
    <>
      <div className="text-base font-bold">{t('settings.offlineupdate.title') + ", " + t('settings.about.application') + ": " + currentVersion}</div>

      <div className="my-[20px] h-px bg-neutral-500/10" />

      <div className="flex min-h-[150px] flex-col justify-between">
        {status === 'loading' && (
          <div className="flex justify-center pt-24">
            <Spin indicator={<LoadingOutlined spin />} size="large" />
          </div>
        )}

        {status === 'latest' && (
          <div>
            <div className="pb-1 text-neutral-500">{t('settings.offlineupdate.inputfile')}</div>
            <div className="flex items-center space-x-1">
              <div
                  className={clsx(
                    "flex flex-col items-center justify-center w-full h-20 border-2 border-solid rounded-xl transition css-9118ya ant-input-outlined cursor-pointer border-color hover:bg-neutral-500",
                    isDragging ? "bg-neutral-500 border-blue-500" : ""
                  )}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0] ?? null;
                    if (!file || !file.name.toLowerCase().endsWith(".tar.gz")) {
                      setStatus('failed');
                      setErrMsg(t('settings.offlineupdate.noupdatefile'));
                      return;
                    }
                    setStatus('latest');
                    setErrMsg('');
                    setSelectedFile(file);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true); // Datei wird über den Bereich gezogen
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false); // Maus verlässt Bereich
                  }}
                  onClick={() => {
                    document.getElementById("file-upload")?.click()
                  }}
                >
                <span className="text-neutral-100 text-sm p-1">
                  {selectedFile ? selectedFile.name : t('settings.offlineupdate.uploadbox')}
                </span>

                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <Button
                type="primary"
                className="h-20 border-2 w-[5rem]"
                onClick={() => upload(selectedFile)}
                disabled={!selectedFile}
              >
                {t('settings.offlineupdate.ok')}
              </Button>
            </div>
          </div>
        )}

        {status === 'updating' && (
          <div className="flex flex-col items-center justify-center space-y-10 pb-10 pt-24">
            <Spin size="large" />
            <span className="text-blue-600">{t('settings.offlineupdate.updating')}</span>
          </div>
        )}

        {status === 'latests' && (
          <Result
            status="success"
            icon={<SmileOutlined />}
            title={currentVersion}
            subTitle={t('settings.offlineupdate.isLatest')}
            extra={[
              <Button key="confirm" onClick={checkForUpdates}>
                {t('settings.offlineupdate.title')}
              </Button>
            ]}
          />
        )}

        {status === 'failed' && <Result subTitle={errMsg} />}

        <div className="flex justify-center">
          <Button
            type="link"
            size="small"
            href="https://github.com/sipeed/NanoKVM/blob/main/CHANGELOG.md"
            target="_blank"
          >
            CHANGELOG
          </Button>
        </div>
      </div>
    </>
  );
};

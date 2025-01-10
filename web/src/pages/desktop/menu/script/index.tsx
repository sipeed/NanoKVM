import { ChangeEvent, useRef, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Divider, Popconfirm, Popover } from 'antd';
import clsx from 'clsx';
import { ChevronRightIcon, FileJsonIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';

import * as api from '@/api/script.ts';

import { Run } from './run';

export const Script = () => {
  const { t } = useTranslation();
  const isBigScreen = useMediaQuery({ minWidth: 640 });

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [scripts, setScripts] = useState<string[]>([]);
  const [currentScript, setCurrentScript] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<any>(null);

  function handleOpenChange(open: boolean) {
    if (open) {
      getScripts();
    } else {
      setCurrentScript('');
    }

    setIsPopoverOpen(open);
  }

  function selectFile() {
    if (inputRef.current) {
      inputRef.current.value = null;
    }

    inputRef.current?.click();
  }

  function uploadFile(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target?.files?.length) return;
    const file = e.target.files[0];

    if (isUploading) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    api
      .uploadScript(formData)
      .then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }

        if (!scripts.includes(rsp.data.file)) {
          setScripts([...scripts, rsp.data.file]);
        }
      })
      .finally(() => {
        setIsUploading(false);
      });
  }

  function runScript(type: string) {
    if (!currentScript) return;

    if (type === 'foreground') {
      setIsRunning(true);
    } else {
      api.runScript(currentScript, type).then((rsp) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          return;
        }
      });
    }

    setIsPopoverOpen(false);
  }

  function getScripts() {
    api.getScripts().then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      if (rsp.data?.files?.length > 0) {
        setScripts(rsp.data.files);
      }
    });
  }

  function deleteScript() {
    if (!currentScript) return;

    api.deleteScript(currentScript).then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      setScripts(scripts.filter((script) => script !== currentScript));
    });
  }

  function activate(script: string) {
    setCurrentScript(script === currentScript ? '' : script);
  }

  const content = (
    <div className="min-w-[250px]">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-neutral-300">{t('script.title')}</span>

        <input
          ref={inputRef}
          type="file"
          accept=".sh,.py"
          className="hidden"
          onChange={uploadFile}
        />
        <Button
          ghost
          type="primary"
          size="small"
          icon={<UploadOutlined />}
          loading={isUploading}
          onClick={selectFile}
        >
          {t('script.upload')}
        </Button>
      </div>
      <Divider style={{ margin: '10px 0 15px 0' }} />

      {scripts.map((script) => (
        <div
          key={script}
          className={clsx(
            'my-1 cursor-pointer rounded',
            script === currentScript ? 'bg-neutral-700/50' : 'hover:bg-neutral-700/70'
          )}
        >
          <div
            className="flex items-center justify-between space-x-5 px-2 py-1.5"
            onClick={() => activate(script)}
          >
            <div className="max-w-[300px] select-none truncate">{script}</div>
            <div className={clsx('h-[16px] w-[16px]', script === currentScript && 'rotate-90')}>
              <ChevronRightIcon size={16} />
            </div>
          </div>

          {script === currentScript && (
            <div className="flex items-center justify-end space-x-2 p-3">
              <Button type="primary" size="small" onClick={() => runScript('foreground')}>
                {t('script.run')}
              </Button>
              <Button type="primary" size="small" onClick={() => runScript('background')}>
                {t('script.runBackground')}
              </Button>

              <Popconfirm
                title={t('script.attention')}
                description={t('script.delDesc')}
                onConfirm={deleteScript}
                onCancel={() => {}}
                okText={t('script.confirm')}
                cancelText={t('script.cancel')}
                placement="bottom"
              >
                <Button danger type="primary" size="small">
                  {t('script.delete')}
                </Button>
              </Popconfirm>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Popover
        content={content}
        placement={isBigScreen ? 'bottomLeft' : 'bottom'}
        trigger="click"
        arrow={false}
        open={isPopoverOpen}
        onOpenChange={handleOpenChange}
      >
        <div className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700 hover:text-white">
          <FileJsonIcon size={18} />
        </div>
      </Popover>

      {isRunning && <Run script={currentScript} setIsRunning={setIsRunning} />}
    </>
  );
};

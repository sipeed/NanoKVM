import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Input, Modal, Tooltip } from 'antd';
import { LinkIcon, LoaderCircleIcon, UploadIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as downloadApi from '@/api/download.ts';
import { formatSize } from '@/lib/format.ts';
import { getBaseUrl } from '@/lib/service.ts';

type Props = {
  // True while the target machine owns the removable disk: images can still be
  // listed and browsed, but nothing may be written onto it.
  dataOwned: boolean;
  onChanged: () => void;
  onError: (message: string, description?: string) => void;
};

type Transfer = {
  name: string;
  percentage: string;
  // Bytes transferred so far and the expected total; total is 0 while the
  // server does not know the size yet.
  loaded: number;
  total: number;
  failed: boolean;
  message: string;
  // Only a remote download can be cancelled; a browser upload ends with the
  // request itself.
  cancellable: boolean;
};

const sha256Pattern = /^[a-fA-F0-9]{64}$/;

export function useAddMedia({ dataOwned, onChanged, onError }: Props) {
  const { t } = useTranslation();

  const [isUrlOpen, setIsUrlOpen] = useState(false);
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [isDataWritable, setIsDataWritable] = useState(true);

  const [urlForm] = Form.useForm();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const polling = useRef(false);

  // The image downloader reports progress through its own status endpoint;
  // this polls it for both the browser upload and the remote download.
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!polling.current) return;

      const rsp = await downloadApi.statusImage();
      if (rsp.code !== 0) return;

      const { status, file, percentage, loaded, total } = rsp.data;
      if (status === 'idle') return;

      setTransfer((current) => ({
        name: file,
        percentage: percentage ?? '',
        loaded: loaded ?? 0,
        total: total ?? 0,
        failed: status === 'failed' || status === 'checksum_failed',
        message: '',
        cancellable: current?.cancellable ?? false
      }));

      if (status === 'success' || status === 'failed' || status === 'checksum_failed') {
        polling.current = false;
        if (status === 'success') {
          setTimeout(() => setTransfer(null), 3000);
          onChanged();
        }
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [onChanged]);

  // The data partition is mounted read-only on some builds, and nothing can be
  // stored there until it is not.
  useEffect(() => {
    void downloadApi.imageEnabled().then((rsp) => {
      if (rsp.code === 0) setIsDataWritable(rsp.data?.enabled !== false);
    });
  }, []);

  async function cancel() {
    const rsp = await downloadApi.cancelDownloadImage();
    if (rsp.code !== 0) {
      onError(rsp.msg || t('download.cancelFailed'));
      return;
    }

    polling.current = false;
    setTransfer(null);
  }

  async function uploadImage(file: File | null) {
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith('.iso') && !name.endsWith('.img')) {
      onError(t('storage.add.onlyImages'));
      return;
    }

    polling.current = true;
    setTransfer({
      name: file.name,
      percentage: '',
      loaded: 0,
      total: 0,
      failed: false,
      message: '',
      cancellable: false
    });

    const form = new FormData();
    form.append('file', file);

    try {
      const response = await fetch(`${getBaseUrl('http')}/api/download/file`, {
        method: 'POST',
        body: form,
        credentials: import.meta.env.VITE_WITH_CREDENTIALS === 'false' ? 'omit' : 'include'
      });
      const rsp = await response.json();

      if (!response.ok || rsp.code !== 0) {
        polling.current = false;
        setTransfer(null);
        onError(rsp.msg || t('storage.add.uploadFailed'));
        return;
      }

      onChanged();
      setTimeout(() => setTransfer(null), 3000);
    } catch {
      polling.current = false;
      setTransfer(null);
      onError(t('storage.add.uploadFailed'));
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }

  async function downloadFromUrl() {
    const values = await urlForm.validateFields();

    polling.current = true;
    setTransfer({
      name: values.url,
      percentage: '',
      loaded: 0,
      total: 0,
      failed: false,
      message: '',
      cancellable: true
    });

    const rsp = await downloadApi.downloadImage(values.url, values.sha256 ?? '');
    if (rsp.code !== 0) {
      polling.current = false;
      setTransfer(null);
      onError(rsp.msg || t('storage.add.downloadFailed'));
      return;
    }

    setIsUrlOpen(false);
    urlForm.resetFields();
  }

  // The buttons belong in the image group's title row, the messages belong
  // below it, and the dialogs are rendered by the page. Keeping them apart is
  // what keeps a long status line from squeezing the group title.
  const actions = (
    <div className="flex items-center space-x-1">
      <Tooltip title={dataOwned ? t('storage.add.blocked') : t('storage.add.upload')}>
        <Button
          size="small"
          icon={<UploadIcon size={14} />}
          disabled={dataOwned}
          onClick={() => imageInputRef.current?.click()}
        />
      </Tooltip>
      <Tooltip title={dataOwned ? t('storage.add.blocked') : t('storage.add.fromUrl')}>
        <Button
          size="small"
          icon={<LinkIcon size={14} />}
          disabled={dataOwned}
          onClick={() => setIsUrlOpen(true)}
        />
      </Tooltip>
    </div>
  );

  const status = (
    <>
      {!isDataWritable && (
        <Alert type="warning" showIcon className="text-xs" message={t('download.disabled')} />
      )}

      {transfer && (
        <Alert
          type={transfer.failed ? 'error' : 'info'}
          showIcon
          icon={
            transfer.failed ? undefined : <LoaderCircleIcon size={12} className="animate-spin" />
          }
          message={
            transfer.failed ? (
              transfer.message || t('storage.failed')
            ) : (
              <span className="flex items-center space-x-2 text-xs">
                <span className="min-w-0 flex-1 truncate" title={transfer.name}>
                  {transfer.name}
                </span>
                <span className="shrink-0 text-neutral-400">
                  {transfer.percentage}
                  {transfer.total > 0 &&
                    ` · ${formatSize(transfer.loaded)} / ${formatSize(transfer.total)}`}
                </span>
              </span>
            )
          }
          action={
            transfer.cancellable && (
              <Button
                type="text"
                size="small"
                icon={<XIcon size={12} />}
                title={t('download.cancel')}
                onClick={() => void cancel()}
              />
            )
          }
        />
      )}
    </>
  );

  const overlays = (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept=".iso,.img"
        className="hidden"
        onChange={(event) => void uploadImage(event.target.files?.[0] ?? null)}
      />

      <Modal
        title={t('storage.add.fromUrl')}
        open={isUrlOpen}
        okText={t('storage.yes')}
        cancelText={t('storage.no')}
        onOk={() => void downloadFromUrl()}
        onCancel={() => setIsUrlOpen(false)}
      >
        <Form form={urlForm} layout="vertical">
          <Form.Item
            name="url"
            label={t('storage.add.url')}
            rules={[{ required: true, message: t('storage.add.urlRequired') }]}
          >
            <Input placeholder="https://example.com/image.iso" />
          </Form.Item>
          <Form.Item
            name="sha256"
            label={t('download.sha256')}
            rules={[
              {
                validator: (_, value) =>
                  !value || sha256Pattern.test(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('download.invalidSHA256')))
              }
            ]}
          >
            <Input placeholder={t('download.sha256Placeholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );

  return { actions, status, overlays };
}

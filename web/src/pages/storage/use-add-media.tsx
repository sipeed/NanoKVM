import { useEffect, useRef, useState } from 'react';
import { Button, Form, Input, Modal, Tooltip } from 'antd';
import clsx from 'clsx';
import { LinkIcon, UploadIcon } from 'lucide-react';
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

// An image arriving from the browser or from a URL, reported by the image
// downloader's status endpoint. The page renders it at the top, in the same
// place and shape as a media job, instead of a separate hint inside the
// image group.
export type Transfer = {
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
  // The server verifies the checksum of an upload when the client sends one;
  // a browser cannot hash gigabytes before sending them, so the expected sum is
  // typed in instead.
  const [checksum, setChecksum] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

    const sum = checksum.trim();
    if (sum && !sha256Pattern.test(sum)) {
      onError(t('download.invalidSHA256'));
      return;
    }

    // Close the picker before starting the transfer so progress and errors are
    // visible in the media list. Invalid files and checksums stay in the dialog.
    closeUpload();

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
        headers: sum ? { 'X-SHA256-Sum': sum } : undefined,
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

  function closeUpload() {
    setIsUploadOpen(false);
    setPendingFile(null);
    setChecksum('');
    setIsDragging(false);
  }

  // The dialog's area takes a click (choose a file) and a drop, so an image can
  // come from a file manager window as well.
  const dropProps = {
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (!dataOwned) setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      if (dataOwned) return;
      setPendingFile(event.dataTransfer?.files?.[0] ?? null);
    }
  };

  // The buttons belong in the image group's title row.
  const actions = (
    <div className="flex items-center space-x-1">
      <Tooltip title={dataOwned ? t('storage.add.blocked') : t('storage.add.upload')}>
        <Button
          size="small"
          icon={<UploadIcon size={14} />}
          disabled={dataOwned}
          onClick={() => setIsUploadOpen(true)}
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

  const overlays = (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept=".iso,.img"
        className="hidden"
        onChange={(event) => {
          setPendingFile(event.target.files?.[0] ?? null);
          if (imageInputRef.current) imageInputRef.current.value = '';
        }}
      />

      <Modal
        title={t('storage.add.title')}
        open={isUploadOpen}
        okText={t('storage.yes')}
        cancelText={t('storage.no')}
        okButtonProps={{ disabled: !pendingFile }}
        onOk={() => void uploadImage(pendingFile)}
        onCancel={closeUpload}
      >
        <div className="flex flex-col space-y-3">
          {/* Clicking chooses a file, dropping one works the same way. */}
          <div
            {...dropProps}
            onClick={() => imageInputRef.current?.click()}
            className={clsx(
              'flex h-24 cursor-pointer items-center justify-center rounded border border-dashed px-4 text-center text-xs',
              isDragging
                ? 'border-blue-500 text-blue-400'
                : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
            )}
          >
            {pendingFile ? (
              <span className="truncate" title={pendingFile.name}>
                {pendingFile.name} · {formatSize(pendingFile.size)}
              </span>
            ) : (
              <span>{t('storage.add.dropHint')}</span>
            )}
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-xs text-neutral-500">{t('download.sha256')}</span>
            <Input
              allowClear
              placeholder={t('download.sha256Placeholder')}
              value={checksum}
              onChange={(event) => setChecksum(event.target.value)}
            />
          </div>
        </div>
      </Modal>

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

  return { actions, transfer, cancelTransfer: cancel, overlays };
}

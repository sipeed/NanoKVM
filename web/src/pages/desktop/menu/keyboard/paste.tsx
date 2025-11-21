import { ChangeEvent, useRef, useState } from 'react';
import { Button, Input, Modal, Select, message, type InputRef } from 'antd';
import clsx from 'clsx';
import { useSetAtom } from 'jotai';
import { ClipboardIcon, ClipboardPasteIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { paste } from '@/api/hid';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';

const { Option } = Select;

const { TextArea } = Input;

export const Paste = () => {
  const { t } = useTranslation();
  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'' | 'error'>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [isReadingClipboard, setIsReadingClipboard] = useState(false);
  const [langue, setLangue] = useState('en');

  const inputRef = useRef<InputRef>(null);

  function onChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setStatus(isASCII(value) ? '' : 'error');
    setInputValue(value);
  }

  async function readFromClipboard() {
    if (isReadingClipboard) return;

    setIsReadingClipboard(true);
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        message.error(t('keyboard.clipboardNotSupported') || 'Clipboard API is not supported in this browser');
        return;
      }

      // Read text from clipboard
      const text = await navigator.clipboard.readText();

      if (!text) {
        message.warning(t('keyboard.clipboardEmpty') || 'Clipboard is empty');
        return;
      }

      // Validate ASCII
      if (!isASCII(text)) {
        setStatus('error');
        setInputValue(text);
        message.error(t('keyboard.nonAsciiError') || 'Only ASCII characters are supported');
        return;
      }

      // Check length
      if (text.length > 1024) {
        message.warning(t('keyboard.clipboardTooLong') || 'Clipboard content exceeds 1024 characters');
        setInputValue(text.substring(0, 1024));
        setStatus('');
        return;
      }

      setInputValue(text);
      setStatus('');
      message.success(t('keyboard.clipboardRead') || 'Clipboard content loaded');
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          message.error(t('keyboard.clipboardPermissionDenied') || 'Clipboard permission denied. Please allow clipboard access in your browser.');
        } else {
          message.error(t('keyboard.clipboardReadError') || `Failed to read clipboard: ${error.message}`);
        }
      } else {
        message.error(t('keyboard.clipboardReadError') || 'Failed to read clipboard');
      }
    } finally {
      setIsReadingClipboard(false);
    }
  }

  function submit() {
    if (isLoading) return;
    setIsLoading(true);

    paste(inputValue, langue)
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        setInputValue('');
        setStatus('');
        setErrMsg('');
        setIsModalOpen(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function afterOpenChange(open: boolean) {
    if (open) {
      inputRef.current?.focus();
    }

    setIsKeyboardEnable(!open);
  }

  function isASCII(value: string) {
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) > 127) {
        return false;
      }
    }
    return true;
  }

  return (
    <>
      <div
        className={clsx(
          'flex cursor-pointer select-none items-center space-x-2 rounded py-1 pl-2 pr-5 hover:bg-neutral-700/70'
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <ClipboardIcon size={18} />
        <span>{t('keyboard.paste')}</span>
      </div>

      <Modal
        open={isModalOpen}
        centered={false}
        title={t('keyboard.paste')}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        afterOpenChange={afterOpenChange}
      >
        <div className="pb-3 text-xs text-neutral-500">{t('keyboard.tips')}</div>

        <div className="space-y-2">
          <Select
            value={langue}
            onChange={(value) => setLangue(value)}
            style={{ width: '100%', marginBottom: '12px' }} >
            <Option value="en">{t('keyboard.dropdownEnglish')}</Option>
            <Option value="de">{t('keyboard.dropdownGerman')}</Option>
          </Select>
          <div className="flex items-center gap-2">
            <Button
              icon={<ClipboardPasteIcon size={16} />}
              loading={isReadingClipboard}
              onClick={readFromClipboard}
              className="flex items-center"
            >
              {t('keyboard.readClipboard') || 'Read from Clipboard'}
            </Button>
            <span className="text-xs text-neutral-500">
              {t('keyboard.clipboardHint') || 'Click to paste from your browser clipboard'}
            </span>
          </div>

          <TextArea
            ref={inputRef}
            value={inputValue}
            status={status}
            showCount
            maxLength={1024}
            autoSize={{ minRows: 5, maxRows: 12 }}
            placeholder={t('keyboard.placeholder')}
            onChange={onChange}
          />
        </div>

        {errMsg && <div className="pt-1 text-sm text-red-500">{errMsg}</div>}

        <div className="flex justify-center py-3">
          <Button type="primary" loading={isLoading} htmlType="submit" onClick={submit}>
            {t('keyboard.submit')}
          </Button>
        </div>
      </Modal>
    </>
  );
};

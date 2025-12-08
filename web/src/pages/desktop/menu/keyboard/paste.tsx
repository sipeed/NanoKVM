import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Button, Divider, Input, Modal, Select } from 'antd';
import type { InputRef } from 'antd';
import clsx from 'clsx';
import { useSetAtom } from 'jotai';
import { ClipboardIcon, ClipboardPasteIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { paste } from '@/api/hid';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';

type InputStatus = '' | 'error';

export const Paste = () => {
  const { t } = useTranslation();
  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isClipboardSupported, setIsClipboardSupported] = useState(false);
  const [isReadingClipboard, setIsReadingClipboard] = useState(false);
  const [langue, setLangue] = useState('en');
  const [status, setStatus] = useState<InputStatus>('');
  const [errMsg, setErrMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<InputRef>(null);

  const languages = [
    { value: 'en', label: t('keyboard.dropdownEnglish') },
    { value: 'de', label: t('keyboard.dropdownGerman') }
  ];

  useEffect(() => {
    setIsClipboardSupported('clipboard' in navigator);
  }, []);

  function onChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setStatus(isAsciiOrRU(value) ? '' : 'error');
    setInputValue(value);
  }

  async function readFromClipboard() {
    if (isReadingClipboard) return;
    setIsReadingClipboard(true);

    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        return;
      }
      setInputValue((value) => value + text);
    } catch (error) {
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setErrMsg(t('keyboard.clipboardPermissionDenied'));
        return;
      }
      setErrMsg(t('keyboard.clipboardReadError'));
    } finally {
      setIsReadingClipboard(false);
    }
  }
  
  // Extended RU → EN translation including punctuation (applies only if Cyrillic is present)
  function translateRuToEnWithPunctuation(value: string): string {
    const hasCyrillic = /[А-Яа-яЁё]/.test(value);

    const letterMap: Record<string, string> = {
      'ё': '`',
      'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i',
      'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']',
      'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k',
      'д': 'l', 'ж': ';', 'э': '\'',
      'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.',
    };

    const punctuationMap: Record<string, string> = {
      '"': '@',
      '№': '#',
      ';': '$',
      ':': '^',
      '?': '&',
      'Ё': '~',
      '/': '|',
      '.': '/',
      ',': '?',
    };

    return Array.from(value).map((ch) => {
      const lower = ch.toLowerCase();
      if (letterMap[lower]) {
        const translated = letterMap[lower];
        return ch === lower ? translated : translated.toUpperCase();
      }
      if (hasCyrillic && punctuationMap[ch]) {
        return punctuationMap[ch];
      }
      return ch;
    }).join('');
  }

  function submit() {
    if (isLoading || !inputValue) return;
    setIsLoading(true);

    const translated = translateRuToEnWithPunctuation(inputValue);

    paste(translated, langue)
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

  function isAsciiOrRU(value: string) {
    // Allow ASCII and Russian Cyrillic letters
    for (const ch of value) {
      const code = ch.codePointAt(0) ?? 0;
      if (code <= 0x7F) continue; // ASCII
      if (
        (code >= 0x0410 && code <= 0x042F) || // (А-Я)
        (code >= 0x0430 && code <= 0x044F) || // (а-я)
        code === 0x0401 || // (Ё)
        code === 0x0451    // (ё)
      ) {
        continue;
      }
      return false;
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
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        afterOpenChange={afterOpenChange}
      >
        <div className="flex flex-col">
          <span className="text-xl">{t('keyboard.paste')}</span>
          <span className="text-sm text-neutral-600">{t('keyboard.tips')}</span>
        </div>

        <Divider style={{ margin: '14px 0' }} />

        <div
          className={clsx(
            'flex w-full items-center space-x-3 pb-2',
            isClipboardSupported ? 'justify-start' : 'justify-end'
          )}
        >
          {isClipboardSupported && (
            <Button
              color="default"
              variant="filled"
              icon={<ClipboardPasteIcon size={16} />}
              loading={isReadingClipboard}
              onClick={readFromClipboard}
              className="flex items-center"
            >
              {t('keyboard.readClipboard') || 'Read from Clipboard'}
            </Button>
          )}

          <Select
            value={langue}
            variant="filled"
            onChange={(value) => setLangue(value)}
            options={languages}
          ></Select>
        </div>

        <Input.TextArea
          ref={inputRef}
          value={inputValue}
          status={status}
          showCount
          maxLength={1024}
          autoSize={{ minRows: 6, maxRows: 12 }}
          placeholder={t('keyboard.placeholder')}
          onFocus={() => setErrMsg('')}
          onChange={onChange}
        />

        {errMsg && <div className="pt-1 text-sm text-red-500">{errMsg}</div>}

        <div className="flex justify-center py-5">
          <Button
            type="primary"
            loading={isLoading}
            htmlType="submit"
            style={{ width: '300px' }}
            onClick={submit}
          >
            {t('keyboard.submit')}
          </Button>
        </div>
      </Modal>
    </>
  );
};

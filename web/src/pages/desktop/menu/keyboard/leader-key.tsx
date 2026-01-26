import { useEffect, useState } from 'react';
import { Button, Input, Modal, Switch } from 'antd';
import clsx from 'clsx';
import { useAtom, useSetAtom } from 'jotai';
import {
  ArrowBigUpIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CommandIcon,
  KeyboardIcon,
  KeyIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/hid.ts';
import { isKeyboardEnableAtom, leaderKeyAtom } from '@/jotai/keyboard.ts';

export const LeaderKey = () => {
  const { t } = useTranslation();

  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);
  const [leaderKey, setLeaderKey] = useAtom(leaderKeyAtom);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeaderKeyEnable, setIsLeaderKeyEnable] = useState(false);
  const [tempLeaderKey, setTempLeaderKey] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDocCollapsed, setIsDocCollapsed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const optionalKeys = [
    {
      value: 'ShiftRight',
      label: t('keyboard.leaderKey.shiftRight'),
      icon: <ArrowBigUpIcon size={16} />
    },
    {
      value: 'ControlRight',
      label: t('keyboard.leaderKey.ctrlRight'),
      icon: <ChevronUpIcon size={16} />
    },
    {
      value: 'MetaRight',
      label: t('keyboard.leaderKey.metaRight'),
      icon: <CommandIcon size={16} />
    }
  ];

  useEffect(() => {
    if (!isFocused) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setTempLeaderKey(event.code);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocused]);

  function openModal() {
    setIsKeyboardEnable(false);
    setIsLeaderKeyEnable(!!leaderKey);
    setTempLeaderKey(leaderKey);
    setIsDocCollapsed(true);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsKeyboardEnable(true);
    setIsModalOpen(false);
  }

  function submit() {
    if (isLoading) return;

    const key = isLeaderKeyEnable ? tempLeaderKey : '';
    if (key === leaderKey) {
      closeModal();
      return;
    }

    setIsLoading(true);

    api
      .setLeaderKey(key)
      .then((rsp) => {
        if (rsp.code === 0) {
          setLeaderKey(key);
          closeModal();
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <>
      <div
        className="flex cursor-pointer select-none items-center space-x-2 rounded py-1 pl-2 pr-5 hover:bg-neutral-700/70"
        onClick={openModal}
      >
        <KeyIcon size={18} />
        <span>{t('keyboard.leaderKey.title')}</span>
      </div>

      <Modal width={510} keyboard={false} footer={null} open={isModalOpen} onCancel={closeModal}>
        <div className="my-3 flex flex-col space-y-3">
          {/* title */}
          <div className="flex flex-col space-y-1">
            <span className="text-lg"> {t('keyboard.leaderKey.title')}</span>
            <span className="text-xs text-neutral-500">{t('keyboard.leaderKey.desc')}</span>
          </div>

          {/* Document */}
          <div className="rounded-lg bg-neutral-800 py-3">
            <div
              className="flex cursor-pointer items-center justify-between px-5"
              onClick={() => setIsDocCollapsed((c) => !c)}
            >
              <span>{t('keyboard.leaderKey.howToUse')}</span>
              <div
                className={clsx(
                  'transition-300 size-[18px] text-neutral-500 transition',
                  isDocCollapsed ? 'rotate-0' : 'rotate-90'
                )}
              >
                <ChevronRightIcon size={18} />
              </div>
            </div>

            {!isDocCollapsed && (
              <ul className="list-outside space-y-3">
                {['simultaneous', 'sequential'].map((key) => (
                  <li>
                    <div className="flex flex-col space-y-2 pr-1">
                      <span className="">{t(`keyboard.leaderKey.${key}.title`)}</span>
                      <span className="text-sm text-neutral-400">
                        {t(`keyboard.leaderKey.${key}.desc1`)}
                      </span>
                      <span className="text-sm text-neutral-400">
                        {t(`keyboard.leaderKey.${key}.desc2`)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Switch */}
          <div className="flex items-center justify-between rounded-lg bg-neutral-800 px-5 py-3">
            <span className="select-none">{t('keyboard.leaderKey.enable')}</span>
            <Switch value={isLeaderKeyEnable} onChange={setIsLeaderKeyEnable} />
          </div>

          {/* Keyboard recorder */}
          {isLeaderKeyEnable && (
            <div className="flex flex-col space-y-5 rounded-lg bg-neutral-800 px-5 py-5">
              <span className="text-sm text-neutral-400">{t('keyboard.leaderKey.tip')}</span>
              <Input
                value={tempLeaderKey}
                className="flex-1"
                placeholder={t('keyboard.leaderKey.placeholder')}
                prefix={<KeyboardIcon size={16} className="text-neutral-500" />}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />

              <div className="flex items-center justify-center space-x-3">
                {optionalKeys.map((key) => (
                  <div
                    key={key.value}
                    className={clsx(
                      'flex w-28 cursor-pointer items-center justify-center space-x-1 rounded py-1 shadow-lg shadow-neutral-800 outline',
                      key.value === tempLeaderKey
                        ? 'text-neutral-300 outline-blue-500'
                        : 'text-neutral-500 outline-neutral-700 hover:shadow-xl hover:outline-neutral-600'
                    )}
                    onClick={() => setTempLeaderKey((k) => (k === key.value ? '' : key.value))}
                  >
                    {key.icon}
                    <span>{key.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex w-full justify-center pt-5">
            <Button className="w-24" type="primary" loading={isLoading} onClick={submit}>
              {t('keyboard.leaderKey.submit')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

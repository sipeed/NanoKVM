import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth.ts';
import { Badge, Modal, Tooltip } from 'antd';
import clsx from 'clsx';
import { useSetAtom } from 'jotai';
import {
  BadgeInfoIcon,
  BotIcon,
  CircleArrowUpIcon,
  NetworkIcon,
  PaletteIcon,
  SettingsIcon,
  SmartphoneIcon,
  UserRoundIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';
import semver from 'semver';

import * as api from '@/api/application.ts';
import * as ls from '@/lib/localstorage.ts';
import { keyboardLockAtom } from '@/jotai/keyboard.ts';
import { submenuOpenCountAtom } from '@/jotai/settings.ts';
import { Tailscale as TailscaleIcon } from '@/components/icons/tailscale';

import { About } from './about';
import { Account } from './account';
import { Appearance } from './appearance';
import { Device } from './device';
import { MCP } from './mcp';
import { Network } from './network';
import { Tailscale } from './tailscale';
import { Update } from './update';

export const Settings = () => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery({ maxWidth: 849 });
  const { hasPermission } = useAuth();
  const canDevice = hasPermission('device');
  const canNetwork = hasPermission('network');
  const canUpdate = hasPermission('update');
  const canMcp = hasPermission('mcp');
  const canTailscale = hasPermission('tailscale');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [currentTab, setCurrentTab] = useState('about');
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const setKeyboardLock = useSetAtom(keyboardLockAtom);
  const setSubmenuOpenCount = useSetAtom(submenuOpenCountAtom);

  const tabs = [
    { id: 'about', icon: <BadgeInfoIcon size={16} />, component: <About /> },
    { id: 'appearance', icon: <PaletteIcon size={16} />, component: <Appearance /> },
    ...(canDevice
      ? [{ id: 'device', icon: <SmartphoneIcon size={16} />, component: <Device /> }]
      : []),
    ...(canNetwork
      ? [{ id: 'network', icon: <NetworkIcon size={16} />, component: <Network /> }]
      : []),
    ...(canMcp ? [{ id: 'mcp', icon: <BotIcon size={16} />, component: <MCP /> }] : []),
    ...(canTailscale
      ? [
          {
            id: 'tailscale',
            icon: <TailscaleIcon size={16} />,
            component: <Tailscale setIsLocked={setIsLocked} />
          }
        ]
      : []),
    ...(canUpdate
      ? [
          {
            id: 'update',
            icon: <CircleArrowUpIcon size={16} />,
            component: <Update setIsLocked={setIsLocked} />
          }
        ]
      : []),
    { id: 'account', icon: <UserRoundIcon size={16} />, component: <Account /> }
  ];

  useEffect(() => {
    if (!canUpdate) return;
    const skip = ls.getSkipUpdate();
    if (!skip) {
      checkForUpdates();
    }
  }, [canUpdate]);

  // A permission change can take away the tab that is open. Fall back to the
  // first tab instead of leaving an empty panel, and release a lock the vanished
  // tab can no longer release itself (an update in progress keeps the modal
  // open, so it would otherwise stay stuck with nothing to show).
  const activeTab = tabs.find((tab) => tab.id === currentTab) ?? tabs[0];
  useEffect(() => {
    if (!activeTab || activeTab.id === currentTab) return;

    setCurrentTab(activeTab.id);
    setIsLocked(false);
  }, [activeTab, currentTab]);

  useEffect(() => {
    scrollViewportRef.current?.scrollTo({ top: 0, left: 0 });
  }, [currentTab]);

  function checkForUpdates() {
    api.getVersion().then((rsp: any) => {
      if (rsp.code !== 0) {
        return;
      }
      if (!rsp.data?.current || !rsp.data?.latest) {
        return;
      }

      if (semver.gt(rsp.data.latest, rsp.data.current)) {
        setIsUpdateAvailable(true);
      }
    });
  }

  function changeTab(tab: string) {
    if (isLocked) {
      return;
    }

    setCurrentTab(tab);

    if (isUpdateAvailable && tab === 'update') {
      setIsUpdateAvailable(false);
      ls.setSkipUpdate(true);
    }
  }

  function openModal() {
    setIsModalOpen(true);
    setKeyboardLock({ source: 'settings-modal', locked: true });
    setSubmenuOpenCount((count) => count + 1);
  }

  function closeModal() {
    if (isLocked) {
      return;
    }

    setKeyboardLock({ source: 'settings-modal', locked: false });
    setIsModalOpen(false);
    setCurrentTab('about');
    setSubmenuOpenCount((count) => Math.max(0, count - 1));
  }

  return (
    <>
      <Tooltip title={t('settings.title')} placement="bottom" mouseEnterDelay={0.6}>
        <button
          type="button"
          aria-label={t('settings.title')}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 hover:bg-neutral-700/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 min-[850px]:h-[30px] min-[850px]:w-[30px]"
          onClick={openModal}
        >
          <Badge dot={isUpdateAvailable} color="blue" offset={[0, 2]}>
            {/* A flex wrapper centers the svg without the baseline gap an inline one
                leaves inside the badge, which is what the old 3px padding hacked around */}
            <div className="flex text-neutral-300 hover:text-white">
              <SettingsIcon size={18} />
            </div>
          </Badge>
        </button>
      </Tooltip>

      <Modal
        open={isModalOpen}
        width={isMobile ? '100vw' : '80%'}
        centered={!isMobile}
        footer={null}
        destroyOnHidden={true}
        onCancel={closeModal}
        style={isMobile ? { top: 0, margin: 0, paddingBottom: 0 } : { maxWidth: '1080px' }}
        styles={{ content: { padding: 0 } }}
      >
        <div
          className={clsx(
            'flex rounded-lg outline outline-1 outline-neutral-700',
            isMobile ? 'h-[100dvh]' : 'h-[80vh] max-h-[700px]'
          )}
        >
          <div
            className={clsx(
              'flex h-full flex-col space-y-1 overflow-y-auto rounded-l-lg bg-neutral-800/90',
              isMobile ? 'w-14 shrink-0 px-1' : 'max-w-[260px] px-1 sm:w-1/5 md:w-1/4 md:px-2'
            )}
          >
            {!isMobile && <div className="px-3 pt-10 text-xl">{t('settings.title')}</div>}
            <div className={isMobile ? 'h-12 shrink-0' : 'h-5 shrink-0'} />
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                aria-label={t(`settings.${tab.id}.title`)}
                title={t(`settings.${tab.id}.title`)}
                aria-current={currentTab === tab.id ? 'page' : undefined}
                disabled={isLocked}
                className={clsx(
                  'flex min-h-11 w-full cursor-pointer select-none items-center rounded-lg border-0 text-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed',
                  isMobile ? 'justify-center' : 'space-x-2 p-2 sm:px-3',
                  currentTab === tab.id
                    ? 'bg-neutral-700/50'
                    : 'bg-transparent hover:bg-neutral-700/50'
                )}
                onClick={() => changeTab(tab.id)}
              >
                <div className="flex h-[16px] w-[16px] items-center justify-center">{tab.icon}</div>

                {isUpdateAvailable && tab.id === 'update' ? (
                  <Badge dot color="blue" offset={[6, 3]}>
                    <span className={clsx('truncate text-sm', isMobile ? 'hidden' : 'block')}>
                      {t(`settings.${tab.id}.title`)}
                    </span>
                  </Badge>
                ) : (
                  <span className={clsx('truncate text-sm', isMobile ? 'hidden' : 'block')}>
                    {t(`settings.${tab.id}.title`)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div
            ref={scrollViewportRef}
            className="h-full min-w-0 flex-1 overflow-y-auto rounded-r-lg bg-neutral-900/50 px-3"
          >
            <div className="flex h-full w-full justify-center">
              <div className="w-full max-w-[600px] pb-10 pt-14">
                <>{activeTab?.component}</>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

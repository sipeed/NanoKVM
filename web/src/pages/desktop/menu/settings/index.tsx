import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Badge, Button, Modal, Tooltip } from 'antd';
import clsx from 'clsx';
import { useSetAtom } from 'jotai';
import {
  ArrowLeftIcon,
  BadgeInfoIcon,
  BotIcon,
  ChevronRightIcon,
  CircleArrowUpIcon,
  NetworkIcon,
  PaletteIcon,
  SettingsIcon,
  SmartphoneIcon,
  UserRoundIcon,
  XIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import semver from 'semver';

import * as api from '@/api/application.ts';
import * as ls from '@/lib/localstorage.ts';
import { keyboardLockAtom } from '@/jotai/keyboard.ts';
import { submenuOpenCountAtom } from '@/jotai/settings.ts';
import { useResponsiveDevice } from '@/hooks/useResponsiveDevice.ts';
import { Tailscale as TailscaleIcon } from '@/components/icons/tailscale';
import { useDismissMobileMenu } from '@/components/mobile-menu-context.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

import { About } from './about';
import { Account } from './account';
import { Appearance } from './appearance';
import { Device } from './device';
import { MCP } from './mcp';
import { Network } from './network';
import { Tailscale } from './tailscale';
import { Update } from './update';

const mobileIconButtonClass =
  '!flex !size-9 !min-w-0 !items-center !justify-center !rounded !p-0 text-neutral-300 enabled:hover:!bg-neutral-700 enabled:hover:!text-white enabled:active:!bg-neutral-600/70';

type SettingTab =
  | 'about'
  | 'appearance'
  | 'device'
  | 'network'
  | 'mcp'
  | 'tailscale'
  | 'update'
  | 'account';

type SettingsProps = {
  tooltipPlacement?: 'bottom' | 'left' | 'right';
};

export const Settings = ({ tooltipPlacement = 'bottom' }: SettingsProps) => {
  const { t } = useTranslation();
  const responsiveDevice = useResponsiveDevice();
  const dismissMobileMenu = useDismissMobileMenu();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [currentTab, setCurrentTab] = useState<SettingTab>('about');
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const isModalOpenRef = useRef(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const setKeyboardLock = useSetAtom(keyboardLockAtom);
  const setSubmenuOpenCount = useSetAtom(submenuOpenCountAtom);

  const tabs: Array<{ id: SettingTab; icon: ReactNode; component: ReactNode }> = [
    { id: 'about', icon: <BadgeInfoIcon size={16} />, component: <About /> },
    { id: 'appearance', icon: <PaletteIcon size={16} />, component: <Appearance /> },
    { id: 'device', icon: <SmartphoneIcon size={16} />, component: <Device /> },
    { id: 'network', icon: <NetworkIcon size={16} />, component: <Network /> },
    { id: 'mcp', icon: <BotIcon size={16} />, component: <MCP /> },
    {
      id: 'tailscale',
      icon: <TailscaleIcon />,
      component: <Tailscale setIsLocked={setIsLocked} />
    },
    {
      id: 'update',
      icon: <CircleArrowUpIcon size={16} />,
      component: <Update setIsLocked={setIsLocked} />
    },
    { id: 'account', icon: <UserRoundIcon size={18} />, component: <Account /> }
  ];

  useEffect(() => {
    const skip = ls.getSkipUpdate();
    if (!skip) checkForUpdates();
  }, []);

  useEffect(() => {
    scrollViewportRef.current?.scrollTo({ top: 0, left: 0 });
  }, [currentTab]);

  function checkForUpdates() {
    api.getVersion().then((rsp: any) => {
      if (rsp.code !== 0 || !rsp.data?.current || !rsp.data?.latest) return;

      if (semver.gt(rsp.data.latest, rsp.data.current)) {
        setIsUpdateAvailable(true);
      }
    });
  }

  function changeTab(tab: SettingTab) {
    if (isLocked) return;

    setCurrentTab(tab);
    if (isUpdateAvailable && tab === 'update') {
      setIsUpdateAvailable(false);
      ls.setSkipUpdate(true);
    }
  }

  function openMobileDetail(tab: SettingTab) {
    if (isLocked) return;
    changeTab(tab);
    setIsMobileDetailOpen(true);
  }

  const openModal = useCallback(() => {
    if (isModalOpenRef.current) return;

    isModalOpenRef.current = true;
    dismissMobileMenu();
    setIsModalOpen(true);
    setIsMobileDetailOpen(false);
    setKeyboardLock({ source: 'settings-modal', locked: true });
    setSubmenuOpenCount((count) => count + 1);
  }, [dismissMobileMenu, setKeyboardLock, setSubmenuOpenCount]);

  const closeModal = useCallback(() => {
    if (isLocked) return;
    if (!isModalOpenRef.current) return;

    isModalOpenRef.current = false;
    setKeyboardLock({ source: 'settings-modal', locked: false });
    setIsModalOpen(false);
    setIsMobileDetailOpen(false);
    setCurrentTab('about');
    setSubmenuOpenCount((count) => Math.max(0, count - 1));
  }, [isLocked, setKeyboardLock, setSubmenuOpenCount]);

  useEffect(() => {
    return () => {
      if (!isModalOpenRef.current) return;

      isModalOpenRef.current = false;
      setKeyboardLock({ source: 'settings-modal', locked: false });
      setSubmenuOpenCount((count) => Math.max(0, count - 1));
    };
  }, [setKeyboardLock, setSubmenuOpenCount]);

  const activeTab = tabs.find((tab) => tab.id === currentTab) ?? tabs[0];
  const isMobileSettingsLayout = responsiveDevice.isMobilePortrait;

  const renderTabTitle = (tab: (typeof tabs)[number], className?: string) => {
    if (isUpdateAvailable && tab.id === 'update') {
      return (
        <Badge className="max-w-full" dot color="blue" offset={[6, 3]}>
          <span className={className}>{t(`settings.${tab.id}.title`)}</span>
        </Badge>
      );
    }

    return <span className={className}>{t(`settings.${tab.id}.title`)}</span>;
  };

  const renderDesktopModal = () => (
    <Modal
      open={isModalOpen}
      width="80%"
      centered
      footer={null}
      destroyOnHidden
      onCancel={closeModal}
      style={{ maxWidth: '1080px' }}
      styles={{ content: { padding: 0 } }}
    >
      <div className="flex h-[80vh] max-h-[700px] rounded-lg outline outline-1 outline-neutral-700">
        <div className="flex h-full min-h-0 max-w-[260px] flex-col rounded-l-lg bg-neutral-800 px-1 sm:w-1/5 md:w-1/4 md:px-2">
          <div className="hidden shrink-0 px-3 pt-10 text-xl sm:block">{t('settings.title')}</div>
          <div className="h-10 shrink-0 sm:h-5" />
          <ScrollArea className="min-h-0 flex-1 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                disabled={isLocked}
                onClick={() => changeTab(tab.id)}
                className={clsx(
                  'nanokvm-button-base flex w-full items-center space-x-2 rounded-lg p-2 text-left text-neutral-200 sm:px-3',
                  currentTab === tab.id ? 'bg-neutral-700/50' : 'hover:bg-neutral-700/50',
                  isLocked && 'cursor-not-allowed opacity-60'
                )}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">{tab.icon}</span>
                {renderTabTitle(tab, 'hidden truncate text-sm sm:block')}
              </button>
            ))}
          </ScrollArea>
        </div>

        <ScrollArea
          viewportRef={scrollViewportRef}
          className="h-full w-full rounded-r-lg bg-neutral-900/50 px-3 md:px-5"
        >
          <div className="flex h-full w-full justify-center">
            <div className="w-full max-w-[600px] pb-10 pt-14">{activeTab.component}</div>
          </div>
        </ScrollArea>
      </div>
    </Modal>
  );

  const renderMobileModal = () => (
    <Modal
      open={isModalOpen}
      width="calc(100% - 16px)"
      centered
      footer={null}
      destroyOnHidden
      onCancel={closeModal}
      styles={{
        content: {
          overflow: 'hidden',
          borderRadius: 8,
          background: '#171717',
          outline: '1px solid #404040',
          padding: 0
        }
      }}
    >
      <div className="flex h-[calc(100dvh-32px)] max-h-[700px] flex-col bg-neutral-900">
        <div className="grid h-12 shrink-0 grid-cols-[36px_minmax(0,1fr)_36px] items-center border-b border-neutral-700/80 bg-neutral-800 px-2">
          {isMobileDetailOpen ? (
            <Button
              type="text"
              className={mobileIconButtonClass}
              onClick={() => setIsMobileDetailOpen(false)}
              disabled={isLocked}
              aria-label={t('settings.back')}
              icon={<ArrowLeftIcon size={19} />}
            />
          ) : (
            <span />
          )}
          <span className="min-w-0 truncate px-2 text-center text-base font-medium text-neutral-100">
            {isMobileDetailOpen ? t(`settings.${activeTab.id}.title`) : t('settings.title')}
          </span>
          <Button
            type="text"
            className={mobileIconButtonClass}
            onClick={closeModal}
            disabled={isLocked}
            aria-label={t('settings.close')}
            icon={<XIcon size={19} />}
          />
        </div>
        {isMobileDetailOpen ? (
          <ScrollArea className="min-h-0 flex-1 px-4">
            <div className="mx-auto w-full max-w-[620px] pb-10 pt-5">{activeTab.component}</div>
          </ScrollArea>
        ) : (
          <ScrollArea className="min-h-0 flex-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                disabled={isLocked}
                onClick={() => openMobileDetail(tab.id)}
                className="nanokvm-button-base flex w-full items-center gap-3 rounded px-3 py-3 text-left text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex size-5 shrink-0 items-center justify-center">{tab.icon}</span>
                {renderTabTitle(tab, 'min-w-0 flex-1 truncate text-sm')}
                <ChevronRightIcon size={18} className="shrink-0 text-neutral-500" />
              </button>
            ))}
          </ScrollArea>
        )}
      </div>
    </Modal>
  );

  return (
    <>
      <Tooltip
        title={isMobileSettingsLayout ? null : t('settings.title')}
        placement={tooltipPlacement}
        mouseEnterDelay={0.6}
      >
        <Button
          type="text"
          aria-label={
            isUpdateAvailable
              ? `${t('settings.title')}: ${t('settings.update.title')}`
              : t('settings.title')
          }
          className={clsx(
            'group !flex !h-[30px] !w-[30px] !min-w-[30px] !items-center !justify-center !rounded !p-0 text-neutral-300 enabled:hover:!bg-neutral-700/80 enabled:hover:!text-white enabled:active:!bg-neutral-600/70'
          )}
          onClick={openModal}
          icon={
            <Badge dot={isUpdateAvailable} color="blue" offset={[0, 2]}>
              <span className="block pt-[3px] text-neutral-300 transition-colors group-hover:text-white group-active:text-white">
                <SettingsIcon size={18} aria-hidden="true" />
              </span>
            </Badge>
          }
        />
      </Tooltip>

      {isMobileSettingsLayout ? renderMobileModal() : renderDesktopModal()}
    </>
  );
};

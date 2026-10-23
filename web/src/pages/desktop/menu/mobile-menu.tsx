import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth.ts';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ChevronDownIcon, ChevronUpIcon, EllipsisIcon, KeyboardIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getMenuDisabledItems, getMenuDisplayMode } from '@/lib/localstorage.ts';
import { isKeyboardOpenAtom } from '@/jotai/keyboard.ts';
import { picoclawChatOpenAtom } from '@/jotai/picoclaw.ts';
import {
  menuCloseSignalAtom,
  menuDisabledItemsAtom,
  menuDisplayModeAtom,
  mobileMenuCollapsedAtom,
  submenuOpenCountAtom
} from '@/jotai/settings.ts';

import { Fullscreen } from './fullscreen';
import { Keyboard } from './keyboard';
import { Mouse } from './mouse';
import { Picoclaw } from './picoclaw';
import { Power } from './power';
import { Screen } from './screen';
import { Script } from './script';
import { Settings } from './settings';
import { Storage } from './storage';
import { Terminal } from './terminal';
import { Wol } from './wol';

const Action = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex min-w-0 flex-1 flex-col items-center justify-center text-neutral-400">
    {children}
    <span className="max-w-full truncate px-1 text-center text-[11px] leading-3">{label}</span>
  </div>
);

export const MobileMenu = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [disabledItems, setDisabledItems] = useAtom(menuDisabledItemsAtom);
  const [displayMode, setDisplayMode] = useAtom(menuDisplayModeAtom);
  const submenuOpenCount = useAtomValue(submenuOpenCountAtom);
  const closeSignal = useAtomValue(menuCloseSignalAtom);
  const setCloseSignal = useSetAtom(menuCloseSignalAtom);
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useAtom(mobileMenuCollapsedAtom);
  const [isKeyboardOpen, setKeyboardOpen] = useAtom(isKeyboardOpenAtom);
  const isChatOpen = useAtomValue(picoclawChatOpenAtom);

  useEffect(() => {
    setDisabledItems(getMenuDisabledItems());
    setDisplayMode(getMenuDisplayMode());
  }, [setDisabledItems, setDisplayMode]);

  useEffect(() => {
    if (displayMode === 'off') setCollapsed(true);
    if (displayMode === 'always') setCollapsed(false);
  }, [displayMode, setCollapsed]);

  useEffect(() => {
    if (displayMode !== 'auto' || collapsed || moreOpen || submenuOpenCount > 0) return;
    const timer = setTimeout(() => setCollapsed(true), 5000);
    return () => clearTimeout(timer);
  }, [collapsed, displayMode, moreOpen, setCollapsed, submenuOpenCount]);

  useEffect(() => setMoreOpen(false), [closeSignal]);

  useEffect(() => {
    if (collapsed && moreOpen) {
      setMoreOpen(false);
      setCloseSignal((value) => value + 1);
    }
  }, [collapsed, moreOpen, setCloseSignal]);

  useEffect(() => {
    if ((isKeyboardOpen || isChatOpen) && moreOpen) {
      setMoreOpen(false);
      setCloseSignal((value) => value + 1);
    }
  }, [isKeyboardOpen, isChatOpen, moreOpen, setCloseSignal]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
        setCloseSignal((value) => value + 1);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [moreOpen, setCloseSignal]);

  const enabled = (item: string) => !disabledItems.includes(item);
  const toggleMore = () => {
    if (moreOpen) setCloseSignal((value) => value + 1);
    setMoreOpen((open) => !open);
  };

  return (
    <>
      {collapsed && (
        <button
          type="button"
          className="fixed left-1/2 top-0 z-[1000] flex h-9 w-14 -translate-x-1/2 items-center justify-center rounded-b-xl border border-t-0 border-white/10 bg-neutral-900/95 p-0 text-neutral-200 shadow-lg"
          style={{ marginTop: 'env(safe-area-inset-top)' }}
          aria-label={t('menu.expand')}
          onClick={() => setCollapsed(false)}
        >
          <ChevronDownIcon size={20} />
        </button>
      )}
      <div
        hidden={collapsed}
        className="fixed inset-x-0 top-0 z-[1000] border-b border-white/10 bg-neutral-900/95 shadow-lg backdrop-blur-md"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <nav
          className="mx-auto flex h-14 max-w-xl items-center justify-around gap-1 px-2"
          aria-label={t('menu.mobileControls')}
        >
          <Action label={t('screen.title')}>
            <Screen />
          </Action>
          {hasPermission('console.control') && (
            <Action label={t('keyboard.title')}>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded border-0 bg-transparent p-0 text-neutral-300 hover:bg-neutral-700/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
                aria-label={t('keyboard.virtual')}
                onClick={() => setKeyboardOpen((open) => !open)}
              >
                <KeyboardIcon size={18} />
              </button>
            </Action>
          )}
          {hasPermission('power') && enabled('power') && (
            <Action label={t('power.title')}>
              <Power />
            </Action>
          )}
          <Action label={t('settings.title')}>
            <Settings />
          </Action>
          <Action label={moreOpen ? t('menu.less') : t('menu.more')}>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded border-0 bg-transparent p-0 text-neutral-300 hover:bg-neutral-700/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
              aria-label={moreOpen ? t('menu.less') : t('menu.more')}
              aria-expanded={moreOpen}
              aria-controls="mobile-console-more"
              onClick={toggleMore}
            >
              {moreOpen ? <XIcon size={20} /> : <EllipsisIcon size={20} />}
            </button>
          </Action>
        </nav>

        <nav
          id="mobile-console-more"
          hidden={!moreOpen}
          className="absolute inset-x-2 top-full max-h-[65dvh] overflow-y-auto rounded-b-xl border border-t-0 border-white/10 bg-neutral-900 p-3 shadow-2xl"
          aria-label={t('menu.more')}
        >
          <div className="grid grid-cols-4 gap-x-1 gap-y-4">
            <Action label={t('mouse.title')}>
              <Mouse />
            </Action>
            {hasPermission('console.control') && (
              <Action label={t('menu.keyboardTools')}>
                <Keyboard />
              </Action>
            )}
            {hasPermission('library.read') && enabled('storage') && (
              <Action label={t('menu.files')}>
                <Storage />
              </Action>
            )}
            {hasPermission('terminal') && enabled('terminal') && (
              <Action label={t('terminal.title')}>
                <Terminal />
              </Action>
            )}
            {hasPermission('terminal') && enabled('script') && (
              <Action label={t('script.title')}>
                <Script />
              </Action>
            )}
            {hasPermission('power') && enabled('wol') && (
              <Action label={t('menu.wol')}>
                <Wol />
              </Action>
            )}
            {hasPermission('ai') && enabled('picoclaw') && (
              <Action label={t('menu.ai')}>
                <Picoclaw />
              </Action>
            )}
            {enabled('fullscreen') && (
              <Action label={t('menu.fullscreen')}>
                <Fullscreen />
              </Action>
            )}
            {enabled('collapse') && (
              <Action label={t('menu.hide')}>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded border-0 bg-transparent p-0 text-neutral-300 hover:bg-neutral-700/80 hover:text-white"
                  aria-label={t('menu.collapse')}
                  onClick={() => setCollapsed(true)}
                >
                  <ChevronUpIcon size={20} />
                </button>
              </Action>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

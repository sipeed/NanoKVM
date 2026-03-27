import { useEffect, useState } from 'react';
import { Splitter } from 'antd';
import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';

import * as storage from '@/lib/localstorage.ts';
import { client } from '@/lib/websocket.ts';
import { picoclawChatOpenAtom } from '@/jotai/picoclaw.ts';
import { resolutionAtom, videoModeAtom } from '@/jotai/screen.ts';
import { Head } from '@/components/head.tsx';

import { Keyboard } from './keyboard';
import { Menu } from './menu';
import { Mouse } from './mouse';
import { Notification } from './notification.tsx';
import { Sidebar as PicoclawSidebar } from './picoclaw';
import { ActionOverlay } from './picoclaw/action-overlay.tsx';
import { Screen } from './screen';
import { VirtualKeyboard } from './virtual-keyboard';

export const Desktop = () => {
  const { t } = useTranslation();
  const isBigScreen = useMediaQuery({ minWidth: 850 });
  const [picoclawSidebarWidth, setPicoclawSidebarWidth] = useState(420);

  const [videoMode, setVideoMode] = useAtom(videoModeAtom);
  const [resolution, setResolution] = useAtom(resolutionAtom);
  const isPicoclawChatOpen = useAtomValue(picoclawChatOpenAtom);

  useEffect(() => {
    client.connect();

    const mode = getVideoMode();
    setVideoMode(mode);

    const res = storage.getResolution() || { width: 0, height: 0 };
    setResolution(res);

    return () => {
      client.close();
    };
  }, []);

  function getVideoMode() {
    const defaultVideoMode = window.RTCPeerConnection ? 'h264' : 'mjpeg';

    const cookieVideoMode = storage.getVideoMode();
    if (cookieVideoMode) {
      if (cookieVideoMode === 'direct' && !window.VideoDecoder) {
        return defaultVideoMode;
      }
      return cookieVideoMode;
    }

    return defaultVideoMode;
  }

  function handleSplitterResize(sizes: number[]) {
    const nextSidebarWidth = sizes[1];
    if (typeof nextSidebarWidth === 'number' && nextSidebarWidth > 0) {
      setPicoclawSidebarWidth(nextSidebarWidth);
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-neutral-950">
      <Head title={t('head.desktop')} />

      {isBigScreen && <Notification />}

      {videoMode && resolution && (
        <div className="relative flex h-full min-h-0 w-full min-w-0">
          <Menu />
          <div className="h-full min-h-0 w-full min-w-0">
            <Splitter
              className="h-full w-full"
              style={{ height: '100%', width: '100%' }}
              onResize={handleSplitterResize}
            >
              <Splitter.Panel min="45%">
                <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden bg-black">
                  <Screen />
                </div>
              </Splitter.Panel>
              <Splitter.Panel
                size={isPicoclawChatOpen ? picoclawSidebarWidth : 0}
                min={isPicoclawChatOpen ? 340 : 0}
                max="45%"
                resizable={isPicoclawChatOpen}
              >
                {isPicoclawChatOpen ? <PicoclawSidebar /> : null}
              </Splitter.Panel>
            </Splitter>
          </div>
          <ActionOverlay />
          <Mouse />
          <Keyboard />
        </div>
      )}

      <VirtualKeyboard />
    </div>
  );
};

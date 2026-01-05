import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';

import * as storage from '@/lib/localstorage.ts';
import { client } from '@/lib/websocket.ts';
import { resolutionAtom, videoModeAtom } from '@/jotai/screen.ts';
import { Head } from '@/components/head.tsx';

import { Keyboard } from './keyboard';
import { Menu } from './menu';
import { Mouse } from './mouse';
import { Notification } from './notification.tsx';
import { Screen } from './screen';
import { VirtualKeyboard } from './virtual-keyboard';

export const Desktop = () => {
  const { t } = useTranslation();
  const isBigScreen = useMediaQuery({ minWidth: 850 });

  const [videoMode, setVideoMode] = useAtom(videoModeAtom);
  const [resolution, setResolution] = useAtom(resolutionAtom);

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

  return (
    <>
      <Head title={t('head.desktop')} />

      {isBigScreen && <Notification />}

      {videoMode && resolution && (
        <>
          <Menu />
          <Screen />
          <Mouse />
          <Keyboard />
        </>
      )}

      <VirtualKeyboard />
    </>
  );
};

import { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';

import { getResolution, getVideoMode } from '@/lib/localstorage.ts';
import { client } from '@/lib/websocket.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';
import { resolutionAtom, videoModeAtom } from '@/jotai/screen.ts';
import { Head } from '@/components/head.tsx';

import { Keyboard } from './keyboard';
import { VirtualKeyboard } from './keyboard/virtual-keyboard';
import { Menu } from './menu';
import { Mouse } from './mouse';
import { Notification } from './notification.tsx';
import { Screen } from './screen';

export const Desktop = () => {
  const { t } = useTranslation();
  const isBigScreen = useMediaQuery({ minWidth: 850 });

  const [videoMode, setVideoMode] = useAtom(videoModeAtom);
  const [resolution, setResolution] = useAtom(resolutionAtom);
  const isKeyboardEnable = useAtomValue(isKeyboardEnableAtom);

  useEffect(() => {
    const cookieVideoMode = getVideoMode();
    setVideoMode(cookieVideoMode ? cookieVideoMode : window.RTCPeerConnection ? 'h264' : 'mjpeg');

    const cookieResolution = getResolution();
    setResolution(cookieResolution ? cookieResolution : { width: 0, height: 0 });

    const timer = setInterval(() => {
      client.send([0]);
    }, 60 * 1000);

    return () => {
      clearInterval(timer);
      client.unregister('stream');
      client.close();
    };
  }, []);

  return (
    <>
      <Head title={t('head.desktop')} />

      {isBigScreen && <Notification />}

      {videoMode && resolution && (
        <>
          <Menu />
          <Screen />
          <Mouse />
          {isKeyboardEnable && <Keyboard />}
        </>
      )}

      <VirtualKeyboard />
    </>
  );
};

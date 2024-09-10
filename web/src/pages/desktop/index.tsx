import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';

import { getResolution } from '@/lib/localstorage.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { client } from '@/lib/websocket.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';
import { resolutionAtom, streamUrlAtom } from '@/jotai/screen.ts';
import { Head } from '@/components/head.tsx';

import { Keyboard } from './keyboard';
import { VirtualKeyboard } from './keyboard/virtual-keyboard';
import { Lib } from './lib.tsx';
import { Menu } from './menu';
import { MenuPhone } from './menu-phone';
import { Mouse } from './mouse';
import { Screen } from './screen';

export const Desktop = () => {
  const { t } = useTranslation();
  const isBigScreen = useMediaQuery({ minWidth: 850 });

  const [resolution, setResolution] = useAtom(resolutionAtom);
  const setStreamUrl = useSetAtom(streamUrlAtom);
  const isKeyboardEnable = useAtomValue(isKeyboardEnableAtom);

  const [isLoading, setIsLoading] = useState(false);
  const [tips, setTips] = useState('');

  useEffect(() => {
    const cookieResolution = getResolution();
    setResolution(cookieResolution ? cookieResolution : { width: 0, height: 0 });

    setStreamUrl(`${getBaseUrl('http')}/api/stream/mjpeg`);

    const timer = setInterval(() => {
      client.send([0]);
    }, 1000 * 60);

    client.register('stream', (message) => {
      const data = JSON.parse(message.data as string);

      if (data.state === 0) {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 5000);
      } else {
        setIsLoading(false);
        const now = Date.now();
        setStreamUrl(`${getBaseUrl('http')}/api/stream/mjpeg?${now}`);
      }
    });

    return () => {
      clearInterval(timer);
      client.unregister('stream');
      client.close();
    };
  }, []);

  return (
    <>
      <Head title={t('head.desktop')} />

      <Spin spinning={isLoading} tip={tips} size="large" fullscreen />

      <Lib setIsLoading={setIsLoading} setTips={setTips} />

      {resolution && (
        <>
          {isBigScreen ? <Menu /> : <MenuPhone />}

          <Screen />

          <Mouse />
          {isKeyboardEnable && <Keyboard />}
        </>
      )}

      <VirtualKeyboard isBigScreen={isBigScreen} />
    </>
  );
};

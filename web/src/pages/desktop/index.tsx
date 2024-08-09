import { useEffect, useState } from 'react';
import { message, Spin } from 'antd';
import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';

import * as api from '@/api/firmware.ts';
import { getResolution } from '@/lib/localstorage.ts';
import { client } from '@/lib/websocket.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';
import { resolutionAtom } from '@/jotai/resolution.ts';
import { Head } from '@/components/head.tsx';

import { Keyboard } from './keyboard';
import { VirtualKeyboard } from './keyboard/virtual-keyboard';
import { Menu } from './menu';
import { MenuPhone } from './menu-phone';
import { Mouse } from './mouse';
import { Screen } from './screen';

export const Desktop = () => {
  const { t } = useTranslation();
  const isBigScreen = useMediaQuery({ minWidth: 850 });
  const [messageApi, contextHolder] = message.useMessage();

  const isKeyboardEnable = useAtomValue(isKeyboardEnableAtom);
  const [resolution, setResolution] = useAtom(resolutionAtom);

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    getLib();

    const cookieResolution = getResolution();
    setResolution(cookieResolution ? cookieResolution : { width: 1280, height: 720 });

    const timer = setInterval(() => {
      client.send([0]);
    }, 1000 * 60);

    return () => {
      clearInterval(timer);
      client.close();
    };
  }, []);

  function getLib() {
    api.getLib().then((rsp) => {
      if (rsp.code !== 0) {
        showMessage(t('checkLibFailed'));
        return;
      }

      if (rsp.data.exist) {
        return;
      }

      downloadLib();
    });
  }

  // 更新 lib
  function downloadLib() {
    setIsUpdating(true);

    api
      .updateLib()
      .then((rsp) => {
        if (rsp.code !== 0) {
          showMessage(t('updateLibFailed'));
          return;
        }

        setTimeout(() => {
          window.location.reload();
        }, 6000);
      })
      .finally(() => {
        setIsUpdating(false);
      });
  }

  function showMessage(content: string) {
    messageApi.open({
      type: 'warning',
      content,
      duration: 10,
      style: {
        marginTop: '8vh'
      }
    });
  }

  return (
    <>
      <Head title={t('head.desktop')} />

      {contextHolder}
      <Spin spinning={isUpdating} tip={t('updatingLib')} size="large" fullscreen />

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

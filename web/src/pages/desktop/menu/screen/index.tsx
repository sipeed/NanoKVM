import { useEffect, useState } from 'react';
import { Divider, Popover, Switch } from 'antd';
import { useAtom, useAtomValue } from 'jotai';
import { MonitorIcon } from 'lucide-react';

import { updateScreen } from '@/api/vm';
import * as ls from '@/lib/localstorage';
import { resolutionAtom } from '@/jotai/resolution';

import { Fps } from './fps';
import { FrameDetect } from './frame-detect';
import { Quality } from './quality';
import { Resolution } from './resolution';
import { useTranslation } from 'react-i18next';
import { fitInWindowAtom } from '@/jotai/scaling';

export const Screen = () => {
  const { t } = useTranslation();

  const resolution = useAtomValue(resolutionAtom);
  const [fps, setFps] = useState(30);
  const [quality, setQuality] = useState(80);
  const [fitInWindow, setFitInWindow] = useAtom(fitInWindowAtom);

  useEffect(() => {
    updateScreen('resolution', resolution!.height);

    const cookieFps = ls.getFps();
    if (cookieFps) {
      updateScreen('fps', cookieFps).then((rsp) => {
        if (rsp.code === 0) {
          setFps(cookieFps);
        }
      });
    }

    const cookieQuality = ls.getQuality();
    if (cookieQuality) {
      updateScreen('quality', cookieQuality).then((rsp) => {
        if (rsp.code === 0) {
          setQuality(cookieQuality);
        }
      });
    }
  }, []);

  return (
    <Popover
      content={
        <div className="flex flex-col space-y-1">
          <Resolution />
          <Fps fps={fps} setFps={setFps} />
          <Quality quality={quality} setQuality={setQuality} />
          <FrameDetect />

          <Divider style={{ margin: '5px 0' }} />

          <div
            className="flex cursor-pointer select-none items-center justify-between space-x-3 rounded px-3 py-1.5 text-white hover:bg-neutral-600"
            onClick={() => setFitInWindow(!fitInWindow)}
          >
            <div>{t('screen.fitInWindow')}</div>
            <Switch size="small" checked={fitInWindow} />
          </div>
        </div>
      }
      placement="bottomLeft"
      trigger="click"
    >
      <div className="flex h-[32px] cursor-pointer items-center justify-center rounded px-2 text-neutral-300 hover:bg-neutral-700/80">
        <MonitorIcon size={18} />
      </div>
    </Popover>
  );
};

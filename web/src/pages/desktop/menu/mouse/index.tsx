import { useEffect } from 'react';
import { Divider } from 'antd';
import { useSetAtom } from 'jotai';
import { MouseIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as ls from '@/lib/localstorage';
import { mouseModeAtom, mouseStyleAtom, scrollIntervalAtom } from '@/jotai/mouse';
import { MenuItem } from '@/components/menu-item.tsx';

import { Cursor } from './cursor.tsx';
import { HidMode } from './hid-mode.tsx';
import { MouseMode } from './mouse-mode.tsx';
import { ResetHid } from './reset-hid.tsx';
import { Speed } from './speed.tsx';

export const Mouse = () => {
  const { t } = useTranslation();

  const setMouseStyle = useSetAtom(mouseStyleAtom);
  const setMouseMode = useSetAtom(mouseModeAtom);
  const setScrollInterval = useSetAtom(scrollIntervalAtom);

  useEffect(() => {
    const mouseStyle = ls.getMouseStyle();
    if (mouseStyle) {
      setMouseStyle(mouseStyle);
    }

    const mouseMode = ls.getMouseMode();
    if (mouseMode) {
      setMouseMode(mouseMode);
    }

    const interval = ls.getMouseScrollInterval();
    if (interval) {
      setScrollInterval(interval);
    }
  }, []);

  const content = (
    <div className="flex flex-col space-y-1">
      <Cursor />
      <MouseMode />
      <Speed />
      <Divider style={{ margin: '10px 0' }} />

      <HidMode />
      <ResetHid />
    </div>
  );

  return <MenuItem title={t('mouse.title')} icon={<MouseIcon size={18} />} content={content} />;
};

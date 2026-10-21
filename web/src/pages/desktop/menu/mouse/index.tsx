import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth.ts';
import { Divider } from 'antd';
import { useSetAtom } from 'jotai';
import { MouseIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as ls from '@/lib/localstorage';
import {
  mouseModeAtom,
  mouseStyleAtom,
  scrollDirectionAtom,
  scrollIntervalAtom
} from '@/jotai/mouse';
import { MenuItem } from '@/components/menu-item.tsx';

import { OriginalResolution } from '../screen/original-resolution.tsx';
import { Cursor } from './cursor.tsx';
import { Direction } from './direction.tsx';
import { HidMode } from './hid-mode.tsx';
import { MouseMode } from './mouse-mode.tsx';
import { ResetHid } from './reset-hid.tsx';
import { Speed } from './speed.tsx';

export const Mouse = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  // HID mode and the HID reset are device settings: the API rejects them
  // without the grant, so the menu must not offer them either.
  const canDevice = hasPermission('device');
  // The input region maps pointer motion onto the target screen, so changing
  // it is part of input control.
  const canControl = hasPermission('console.control');

  const setMouseStyle = useSetAtom(mouseStyleAtom);
  const setMouseMode = useSetAtom(mouseModeAtom);
  const setScrollDirection = useSetAtom(scrollDirectionAtom);
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

    const direction = ls.getMouseScrollDirection();
    if (direction) {
      setScrollDirection(direction > 0 ? 1 : -1);
    }

    const interval = ls.getMouseScrollInterval();
    if (interval) {
      setScrollInterval(interval);
    }
  }, []);

  const content = (
    <div className="flex flex-col space-y-1">
      <Cursor />
      {/* Mode, direction and speed only shape the input this account sends, so a
          view-only account gets none of them; the cursor style is local to the
          screen and stays available. */}
      {canControl && <MouseMode />}
      {canControl && <Direction />}
      {canControl && <Speed />}
      {(canControl || canDevice) && <Divider style={{ margin: '10px 0' }} />}

      {canControl && <OriginalResolution />}
      {canDevice && <HidMode />}
      {canDevice && <ResetHid />}
    </div>
  );

  return <MenuItem title={t('mouse.title')} icon={<MouseIcon size={18} />} content={content} />;
};

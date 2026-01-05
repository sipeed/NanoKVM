import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { MouseReportRelative } from '@/lib/mouse.ts';
import { client, MessageEvent } from '@/lib/websocket.ts';
import { scrollDirectionAtom, scrollIntervalAtom } from '@/jotai/mouse.ts';
import { resolutionAtom } from '@/jotai/screen.ts';

import { MouseRelativeEvent } from './types.ts';

export const Relative = () => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const resolution = useAtomValue(resolutionAtom);
  const scrollDirection = useAtomValue(scrollDirectionAtom);
  const scrollInterval = useAtomValue(scrollIntervalAtom);

  const mouseRef = useRef(new MouseReportRelative());
  const isLockedRef = useRef(false);
  const lastScrollTimeRef = useRef(0);

  useEffect(() => {
    const screen = document.getElementById('screen');
    if (!screen) return;

    showMessage();

    screen.addEventListener('click', handleMouseClick);
    screen.addEventListener('mousedown', handleMouseDown);
    screen.addEventListener('mouseup', handleMouseUp);
    screen.addEventListener('mousemove', handleMouseMove);
    screen.addEventListener('wheel', handleMouseWheel, { passive: false });
    screen.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    // Mouse click event
    function handleMouseClick(event: MouseEvent) {
      disableEvent(event);

      if (!isLockedRef.current) {
        screen?.requestPointerLock();
      }
    }

    // Mouse down event
    function handleMouseDown(e: MouseEvent) {
      disableEvent(e);
      handleMouseEvent({ type: 'mousedown', button: e.button });
    }

    // Mouse up event
    function handleMouseUp(e: MouseEvent) {
      disableEvent(e);
      handleMouseEvent({ type: 'mouseup', button: e.button });
    }

    // Mouse move event
    function handleMouseMove(e: any) {
      disableEvent(e);

      const x = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
      const y = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
      if (x === 0 && y === 0) return;

      const deltaX = Math.abs(x * window.devicePixelRatio) < 10 ? x * 2 : x;
      const deltaY = Math.abs(y * window.devicePixelRatio) < 10 ? y * 2 : y;

      handleMouseEvent({ type: 'move', deltaX, deltaY });
    }

    // Mouse wheel event
    function handleMouseWheel(e: WheelEvent) {
      disableEvent(e);

      if (Math.floor(e.deltaY) === 0) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastScrollTimeRef.current < scrollInterval) {
        return;
      }

      const deltaY = (e.deltaY > 0 ? 1 : -1) * scrollDirection;
      handleMouseEvent({ type: 'wheel', deltaY });
      lastScrollTimeRef.current = currentTime;
    }

    function handlePointerLockChange() {
      isLockedRef.current = document.pointerLockElement === screen;
    }

    return () => {
      screen.removeEventListener('click', handleMouseClick);
      screen.removeEventListener('mousemove', handleMouseMove);
      screen.removeEventListener('mousedown', handleMouseDown);
      screen.removeEventListener('mouseup', handleMouseUp);
      screen.removeEventListener('wheel', handleMouseWheel);
      screen.removeEventListener('contextmenu', disableEvent);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [resolution, scrollDirection, scrollInterval]);

  // Mouse handler
  function handleMouseEvent(event: MouseRelativeEvent) {
    let report: Uint8Array;
    const mouse = mouseRef.current;

    switch (event.type) {
      case 'mousedown':
        mouse.buttonDown(event.button);
        report = mouse.buildButtonReport();
        break;
      case 'mouseup':
        mouse.buttonUp(event.button);
        report = mouse.buildButtonReport();
        break;
      case 'wheel':
        report = mouse.buildReport(0, 0, event.deltaY);
        break;
      case 'move':
        report = mouse.buildReport(event.deltaX, event.deltaY);
        break;
      default:
        report = mouse.buildReport(0, 0);
        break;
    }

    const data = new Uint8Array([MessageEvent.Mouse, ...report]);
    client.send(data);
  }

  // show message
  function showMessage() {
    messageApi.open({
      key: 'requestPointer',
      type: 'info',
      content: t('mouse.requestPointer'),
      duration: 3,
      style: {
        marginTop: '40vh'
      }
    });
  }

  // disable default events
  function disableEvent(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  return <>{contextHolder}</>;
};

import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { client } from '@/lib/websocket.ts';
import { scrollDirectionAtom, scrollIntervalAtom } from '@/jotai/mouse.ts';
import { resolutionAtom } from '@/jotai/screen.ts';

import { MouseButton, MouseEvent } from './constants';

export const Relative = () => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const resolution = useAtomValue(resolutionAtom);
  const scrollDirection = useAtomValue(scrollDirectionAtom);
  const scrollInterval = useAtomValue(scrollIntervalAtom);

  const isLockedRef = useRef(false);
  const buttonRef = useRef<MouseButton>(MouseButton.None);
  const lastScrollTimeRef = useRef(0);

  // listen mouse events
  useEffect(() => {
    const canvas = document.getElementById('screen');
    if (!canvas) return;

    messageApi.open({
      key: 'no_mouse_relative',
      type: 'info',
      content: t('mouse.requestPointer'),
      duration: 3,
      style: {
        marginTop: '40vh'
      }
    });

    document.addEventListener('pointerlockchange', handlePointerLockChange);

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('contextmenu', disableEvent);

    function handleClick(event: any) {
      disableEvent(event);

      if (!isLockedRef.current) {
        canvas!.requestPointerLock();
      }
    }

    function handlePointerLockChange() {
      isLockedRef.current = document.pointerLockElement === canvas;
    }

    // press button
    function handleMouseDown(event: any) {
      disableEvent(event);

      let button: MouseButton;
      switch (event.button) {
        case 0:
          button = MouseButton.Left;
          break;
        case 1:
          button = MouseButton.Wheel;
          break;
        case 2:
          button = MouseButton.Right;
          break;
        default:
          console.log(`unknown button ${event.button}`);
          return;
      }

      buttonRef.current = button;
      const data = [2, MouseEvent.Down, button, 0, 0];
      client.send(data);
    }

    // release button
    function handleMouseUp(event: any) {
      disableEvent(event);

      buttonRef.current = MouseButton.None;
      const data = [2, MouseEvent.Up, MouseButton.None, 0, 0];
      client.send(data);
    }

    // mouse move
    function handleMouseMove(event: any) {
      disableEvent(event);

      const x = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      const y = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
      if (x === 0 && y === 0) return;

      const data = [
        2,
        MouseEvent.MoveRelative,
        buttonRef.current,
        Math.abs(x) < 10 ? x * 2 : x,
        Math.abs(y) < 10 ? y * 2 : y
      ];
      client.send(data);
    }

    // mouse scroll
    function handleWheel(event: any) {
      disableEvent(event);

      if (Math.floor(event.deltaY) === 0) return;

      const currentTime = Date.now();
      if (currentTime - lastScrollTimeRef.current < scrollInterval) {
        return;
      }
      lastScrollTimeRef.current = currentTime;

      const deltaY = (event.deltaY > 0 ? 1 : -1) * scrollDirection;
      const data = [2, MouseEvent.Scroll, 0, 0, deltaY];
      client.send(data);
    }

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);

      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', disableEvent);
    };
  }, [resolution, scrollDirection, scrollInterval]);

  // disable default events
  function disableEvent(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  return <>{contextHolder}</>;
};

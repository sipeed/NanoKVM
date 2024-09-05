import { useEffect } from 'react';
import { useAtomValue } from 'jotai';

import { client } from '@/lib/websocket.ts';
import { resolutionAtom } from '@/jotai/resolution.ts';

import { MouseButton, MouseEvent } from './constants';

export const Absolute = () => {
  const resolution = useAtomValue(resolutionAtom);

  // listen mouse events
  useEffect(() => {
    const canvas = document.getElementById('screen');
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('click', disableEvent);
    canvas.addEventListener('contextmenu', disableEvent);

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

      const data = [2, MouseEvent.Down, button, 0, 0];
      client.send(data);
    }

    // release button
    function handleMouseUp(event: any) {
      disableEvent(event);

      const data = [2, MouseEvent.Up, MouseButton.None, 0, 0];
      client.send(data);
    }

    // mouse move
    function handleMouseMove(event: any) {
      disableEvent(event);

      const rect = canvas!.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const hexX = x < 0 ? 0x0001 : Math.floor(0x7fff * x) + 0x0001;
      const hexY = y < 0 ? 0x0001 : Math.floor(0x7fff * y) + 0x0001;

      const data = [2, MouseEvent.MoveAbsolute, MouseButton.None, hexX, hexY];
      client.send(data);
    }

    // mouse scroll
    function handleWheel(event: any) {
      disableEvent(event);

      const delta = Math.floor(event.deltaY);
      if (delta === 0) return;

      const data = [2, MouseEvent.Scroll, 0, 0, delta];
      client.send(data);
    }

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', disableEvent);
      canvas.removeEventListener('contextmenu', disableEvent);
    };
  }, [resolution]);

  // disable default events
  function disableEvent(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  return <></>;
};

import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';

import { client } from '@/lib/websocket.ts';
import { scrollDirectionAtom, scrollIntervalAtom } from '@/jotai/mouse.ts';
import { resolutionAtom } from '@/jotai/screen.ts';

import { MouseButton, MouseEvent } from './constants';

export const Absolute = () => {
  const resolution = useAtomValue(resolutionAtom);
  const scrollDirection = useAtomValue(scrollDirectionAtom);
  const scrollInterval = useAtomValue(scrollIntervalAtom);

  const lastScrollTimeRef = useRef(0);

  const mouseButtonMapping = (button: number) => {
    const mappings = [MouseButton.Left, MouseButton.Wheel, MouseButton.Right];
    return mappings[button] || MouseButton.None;
  };

  // listen mouse events
  useEffect(() => {
    const canvas = document.getElementById('screen') as HTMLVideoElement;
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

      const button: MouseButton = mouseButtonMapping(event.button);
      if (button === MouseButton.None) return;

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

      const { x, y } = getCoordinate(event);
      const data = [2, MouseEvent.MoveAbsolute, MouseButton.None, x, y];
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

    function getCorrectedCoords(clientX: number, clientY: number) {
      if (!canvas) {
        return { x: 0, y: 0 };
      }

      const rect = canvas.getBoundingClientRect();

      if (!canvas.videoWidth || !canvas.videoHeight) {
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        return { x, y };
      }

      const videoRatio = canvas.videoWidth / canvas.videoHeight;
      const elementRatio = rect.width / rect.height;

      let renderedWidth = rect.width;
      let renderedHeight = rect.height;
      let offsetX = 0;
      let offsetY = 0;

      if (videoRatio > elementRatio) {
        renderedHeight = rect.width / videoRatio;
        offsetY = (rect.height - renderedHeight) / 2;
      } else {
        renderedWidth = rect.height * videoRatio;
        offsetX = (rect.width - renderedWidth) / 2;
      }

      const x = (clientX - rect.left - offsetX) / renderedWidth;
      const y = (clientY - rect.top - offsetY) / renderedHeight;

      return { x, y };
    }

    function getCoordinate(event: any): { x: number; y: number } {
      const { x, y } = getCorrectedCoords(event.clientX, event.clientY);

      const finalX = Math.max(0, Math.min(1, x));
      const finalY = Math.max(0, Math.min(1, y));

      const hexX = Math.floor(0x7fff * finalX) + 0x0001;
      const hexY = Math.floor(0x7fff * finalY) + 0x0001;

      return { x: hexX, y: hexY };
    }

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('click', disableEvent);
      canvas.removeEventListener('contextmenu', disableEvent);
    };
  }, [resolution, scrollDirection, scrollInterval]);

  // disable default events
  function disableEvent(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  return <></>;
};

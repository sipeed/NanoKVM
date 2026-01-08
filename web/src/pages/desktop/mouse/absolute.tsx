import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { useMediaQuery } from 'react-responsive';

import { MouseReportAbsolute } from '@/lib/mouse.ts';
import { client, MessageEvent } from '@/lib/websocket.ts';
import { scrollDirectionAtom, scrollIntervalAtom } from '@/jotai/mouse.ts';
import { resolutionAtom } from '@/jotai/screen.ts';

import { MouseAbsoluteEvent } from './types.ts';

enum MouseButton {
  Left = 0,
  Middle = 1,
  Right = 2,
  Back = 3,
  Forward = 4
}

export const Absolute = () => {
  const isBigScreen = useMediaQuery({ minWidth: 650 });

  const resolution = useAtomValue(resolutionAtom);
  const scrollDirection = useAtomValue(scrollDirectionAtom);
  const scrollInterval = useAtomValue(scrollIntervalAtom);

  const mouseRef = useRef(new MouseReportAbsolute());
  const lastPosRef = useRef({ x: 0.5, y: 0.5 });
  const lastScrollTimeRef = useRef(0);

  // For touch events
  const touchStartTimeRef = useRef(0);
  const lastTouchYRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const hasMoveRef = useRef(false);
  const isDraggingRef = useRef(false);
  const pressedButtonRef = useRef<MouseButton | null>(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  const TAP_THRESHOLD = 8;
  const DRAG_THRESHOLD = 10;
  const VELOCITY_THRESHOLD = 0.3;

  useEffect(() => {
    const screen = document.getElementById('screen') as HTMLVideoElement;
    if (!screen) return;

    screen.addEventListener('mousedown', handleMouseDown);
    screen.addEventListener('mouseup', handleMouseUp);
    screen.addEventListener('mousemove', handleMouseMove);
    screen.addEventListener('wheel', handleWheel);
    screen.addEventListener('click', disableEvent);
    screen.addEventListener('contextmenu', disableEvent);

    if (isBigScreen) {
      screen.addEventListener('touchstart', handleTouchStart);
      screen.addEventListener('touchmove', handleTouchMove);
      screen.addEventListener('touchend', handleTouchEnd);
      screen.addEventListener('touchcancel', handleTouchCancel);
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
    function handleMouseMove(e: MouseEvent) {
      disableEvent(e);
      const { x, y } = getCoordinate(e);
      handleMouseEvent({ type: 'move', x, y });
    }

    // Mouse wheel event
    function handleWheel(e: WheelEvent) {
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

    // Mouse touch start event
    function handleTouchStart(e: TouchEvent) {
      disableEvent(e);

      if (e.touches.length === 0) {
        return;
      }

      const touch = e.touches[0];

      // Reset states
      touchStartTimeRef.current = Date.now();
      lastTouchYRef.current = touch.clientY;
      isLongPressRef.current = false;
      hasMoveRef.current = false;
      isDraggingRef.current = false;
      pressedButtonRef.current = null;
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      const { x, y } = getCoordinate(touch);
      handleMouseEvent({ type: 'move', x, y });

      if (e.touches.length > 1) {
        return;
      }

      // Start long press
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        pressedButtonRef.current = MouseButton.Right;
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

        handleMouseEvent({ type: 'mousedown', button: MouseButton.Right });
      }, 800);
    }

    // Mouse touch move event
    function handleTouchMove(e: TouchEvent) {
      disableEvent(e);

      if (e.touches.length === 0) {
        return;
      }
      const touch = e.touches[0];

      // Handle two-finger scroll first
      if (e.touches.length > 1) {
        const currentTime = Date.now();
        if (currentTime - lastScrollTimeRef.current < scrollInterval) {
          return;
        }

        const deltaY = (touch.clientY - lastTouchYRef.current > 0 ? 1 : -1) * scrollDirection;
        handleMouseEvent({ type: 'wheel', deltaY });

        lastTouchYRef.current = touch.clientY;
        lastScrollTimeRef.current = currentTime;
        return;
      }

      const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const timeDelta = Date.now() - touchStartTimeRef.current;
      const velocity = timeDelta > 0 ? distance / timeDelta : 0;

      const shouldStartDrag =
        distance > DRAG_THRESHOLD || (distance > TAP_THRESHOLD && velocity > VELOCITY_THRESHOLD);

      if (shouldStartDrag && !isDraggingRef.current && !isLongPressRef.current) {
        if (!hasMoveRef.current) {
          hasMoveRef.current = true;
        }

        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        if (pressedButtonRef.current === null) {
          isDraggingRef.current = true;
          pressedButtonRef.current = MouseButton.Left;
          handleMouseEvent({ type: 'mousedown', button: MouseButton.Left });
        }
      }

      if (distance > TAP_THRESHOLD && !hasMoveRef.current) {
        hasMoveRef.current = true;
      }

      if (isDraggingRef.current || isLongPressRef.current) {
        const { x, y } = getCoordinate(touch);
        handleMouseEvent({ type: 'move', x, y });
      }
    }

    // Mouse touch end event
    function handleTouchEnd(e: TouchEvent) {
      disableEvent(e);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (!hasMoveRef.current && !isLongPressRef.current) {
        handleMouseEvent({ type: 'mousedown', button: MouseButton.Left });
        setTimeout(() => {
          handleMouseEvent({ type: 'mouseup', button: MouseButton.Left });
        }, 50);
      } else if (pressedButtonRef.current !== null) {
        handleMouseEvent({ type: 'mouseup', button: pressedButtonRef.current! });
      }

      isLongPressRef.current = false;
      hasMoveRef.current = false;
      isDraggingRef.current = false;
      pressedButtonRef.current = null;
    }

    // Mouse touch cancel event
    function handleTouchCancel(e: any) {
      disableEvent(e);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (pressedButtonRef.current) {
        handleMouseEvent({ type: 'mouseup', button: pressedButtonRef.current! });
      }

      isLongPressRef.current = false;
      hasMoveRef.current = false;
      isDraggingRef.current = false;
      pressedButtonRef.current = null;
    }

    // get mouse coordinate
    function getCoordinate(event: any) {
      const { x, y } = getCorrectedCoords(event.clientX, event.clientY);

      const finalX = Math.max(0, Math.min(1, x));
      const finalY = Math.max(0, Math.min(1, y));

      const hexX = Math.floor(0x7fff * finalX) + 0x0001;
      const hexY = Math.floor(0x7fff * finalY) + 0x0001;

      return { x: hexX, y: hexY };
    }

    function getCorrectedCoords(clientX: number, clientY: number) {
      const rect = screen.getBoundingClientRect();

      if (!screen.videoWidth || !screen.videoHeight) {
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        return { x, y };
      }

      const videoRatio = screen.videoWidth / screen.videoHeight;
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

    return () => {
      screen.removeEventListener('mousemove', handleMouseMove);
      screen.removeEventListener('mousedown', handleMouseDown);
      screen.removeEventListener('mouseup', handleMouseUp);
      screen.removeEventListener('wheel', handleWheel);
      screen.removeEventListener('click', disableEvent);
      screen.removeEventListener('contextmenu', disableEvent);
      screen.removeEventListener('touchstart', handleTouchStart);
      screen.removeEventListener('touchmove', handleTouchMove);
      screen.removeEventListener('touchend', handleTouchEnd);
      screen.removeEventListener('touchcancel', handleTouchCancel);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [isBigScreen, resolution, scrollDirection, scrollInterval]);

  // Mouse event handler
  function handleMouseEvent(event: MouseAbsoluteEvent) {
    let report: Uint8Array;
    const mouse = mouseRef.current;

    switch (event.type) {
      case 'mousedown':
        mouse.buttonDown(event.button);
        report = mouse.buildButtonReport(lastPosRef.current.x, lastPosRef.current.y);
        break;
      case 'mouseup':
        mouse.buttonUp(event.button);
        report = mouse.buildButtonReport(lastPosRef.current.x, lastPosRef.current.y);
        break;
      case 'wheel':
        report = mouse.buildReport(lastPosRef.current.x, lastPosRef.current.y, event.deltaY);
        break;
      case 'move':
        report = mouse.buildReport(event.x, event.y);
        lastPosRef.current = { x: event.x, y: event.y };
        break;
      default:
        report = mouse.buildReport(lastPosRef.current.x, lastPosRef.current.y);
        break;
    }

    sendReport(report);
  }

  function sendReport(report: Uint8Array) {
    const data = new Uint8Array([MessageEvent.Mouse, ...report]);
    client.send(data);
  }

  // disable default events
  function disableEvent(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  return <></>;
};

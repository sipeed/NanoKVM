import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';

import { MouseReportAbsolute } from '@/lib/mouse.ts';
import { client, MessageEvent } from '@/lib/websocket.ts';
import { scrollDirectionAtom, scrollIntervalAtom } from '@/jotai/mouse.ts';
import { inputRegionAtom, resolutionAtom } from '@/jotai/screen.ts';

import {
  FrameContent,
  fullFrameContent,
  getConfiguredFrameContent,
  getMediaSize,
  getRenderedMediaRect,
  MediaSize
} from '../screen/geometry.ts';
import { MouseAbsoluteEvent } from './types.ts';

enum MouseButton {
  Left = 0,
  Middle = 1,
  Right = 2,
  Back = 3,
  Forward = 4
}

export const Absolute = () => {
  const resolution = useAtomValue(resolutionAtom);
  const inputRegion = useAtomValue(inputRegionAtom);
  const scrollDirection = useAtomValue(scrollDirectionAtom);
  const scrollInterval = useAtomValue(scrollIntervalAtom);

  const mouseRef = useRef(new MouseReportAbsolute());
  const lastPosRef = useRef({ x: 0.5, y: 0.5 });
  const lastScrollTimeRef = useRef(0);

  // For touch events
  const lastTouchYRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const hasMoveRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isMultiTouchRef = useRef(false);
  const isTouchActiveRef = useRef(false);
  const pressedButtonRef = useRef<MouseButton | null>(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const lastTapTimeRef = useRef(0);
  const lastTapPosRef = useRef({ x: 0, y: 0 });
  const isDoubleTapCandidateRef = useRef(false);
  const doubleTapDragArmedUntilRef = useRef(0);

  const TAP_THRESHOLD = 8;
  const DRAG_THRESHOLD = 10;
  const DOUBLE_TAP_DELAY = 400;
  const DOUBLE_TAP_DRAG_WINDOW = 800;
  const DOUBLE_TAP_DISTANCE = 24;

  useEffect(() => {
    const screen = document.getElementById('screen');
    if (!screen) return;
    const target = screen;
    const mouse = mouseRef.current;
    const pressedMouseButtons = new Set<number>();
    let pendingMove: { x: number; y: number } | null = null;
    let moveFrame: number | null = null;

    target.addEventListener('mousedown', handleMouseDown);
    target.addEventListener('mouseup', handleMouseUp);
    target.addEventListener('mousemove', handleMouseMove);
    target.addEventListener('wheel', handleWheel);
    target.addEventListener('click', disableEvent);
    target.addEventListener('contextmenu', disableEvent);

    const touchOptions: AddEventListenerOptions = { passive: false };
    target.addEventListener('touchstart', handleTouchStart, touchOptions);
    target.addEventListener('touchmove', handleTouchMove, touchOptions);
    target.addEventListener('touchend', handleTouchEnd, touchOptions);
    target.addEventListener('touchcancel', handleTouchCancel, touchOptions);

    // Mouse event handler
    function handleMouseEvent(event: MouseAbsoluteEvent) {
      let report: Uint8Array;

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

    // Mouse down event
    function handleMouseDown(e: MouseEvent) {
      disableEvent(e);
      if (!getCorrectedCoords(e.clientX, e.clientY)) {
        return;
      }

      flushMouseMove();
      pressedMouseButtons.add(e.button);
      handleMouseEvent({ type: 'mousedown', button: e.button });
    }

    // Mouse up event
    function handleMouseUp(e: MouseEvent) {
      disableEvent(e);
      if (!getCorrectedCoords(e.clientX, e.clientY) && !pressedMouseButtons.has(e.button)) {
        return;
      }

      flushMouseMove();
      pressedMouseButtons.delete(e.button);
      handleMouseEvent({ type: 'mouseup', button: e.button });
    }

    // Mouse move event
    function handleMouseMove(e: MouseEvent) {
      disableEvent(e);
      const coordinate = getCoordinate(e);
      if (!coordinate) {
        return;
      }

      const { x, y } = coordinate;
      queueMouseMove(x, y);
    }

    // Mouse wheel event
    function handleWheel(e: WheelEvent) {
      disableEvent(e);

      if (Math.floor(e.deltaY) === 0 || !getCorrectedCoords(e.clientX, e.clientY)) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastScrollTimeRef.current < scrollInterval) {
        return;
      }

      flushMouseMove();
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

      if (!getCorrectedCoords(touch.clientX, touch.clientY)) {
        isTouchActiveRef.current = false;
        isMultiTouchRef.current = e.touches.length > 1;
        hasMoveRef.current = true;
        clearLongPressTimer();
        releasePressedButton();
        isDoubleTapCandidateRef.current = false;
        doubleTapDragArmedUntilRef.current = 0;
        lastTouchYRef.current = touch.clientY;
        return;
      }

      isTouchActiveRef.current = true;

      if (e.touches.length > 1) {
        isMultiTouchRef.current = true;
        hasMoveRef.current = true;
        clearLongPressTimer();
        releasePressedButton();
        isDoubleTapCandidateRef.current = false;
        lastTouchYRef.current = touch.clientY;
        return;
      }

      const currentTime = Date.now();
      const tapDistance = Math.hypot(
        touch.clientX - lastTapPosRef.current.x,
        touch.clientY - lastTapPosRef.current.y
      );
      isDoubleTapCandidateRef.current =
        (currentTime - lastTapTimeRef.current <= DOUBLE_TAP_DELAY &&
          tapDistance <= DOUBLE_TAP_DISTANCE) ||
        (currentTime <= doubleTapDragArmedUntilRef.current && tapDistance <= DOUBLE_TAP_DISTANCE);

      // Reset states
      lastTouchYRef.current = touch.clientY;
      isLongPressRef.current = false;
      hasMoveRef.current = false;
      isDraggingRef.current = false;
      isMultiTouchRef.current = false;
      releasePressedButton();
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

      clearLongPressTimer();

      const coordinate = getCoordinate(touch);
      if (coordinate) {
        handleMouseEvent({ type: 'move', x: coordinate.x, y: coordinate.y });
      }

      // Start long press
      if (!isDoubleTapCandidateRef.current) {
        longPressTimerRef.current = setTimeout(() => {
          isLongPressRef.current = true;
          pressedButtonRef.current = MouseButton.Right;
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }

          handleMouseEvent({ type: 'mousedown', button: MouseButton.Right });
        }, 800);
      }
    }

    // Mouse touch move event
    function handleTouchMove(e: TouchEvent) {
      disableEvent(e);

      if (e.touches.length === 0) {
        return;
      }
      if (!isTouchActiveRef.current) {
        return;
      }
      const touch = e.touches[0];
      const coordinate = getCoordinate(touch);

      if (!coordinate) {
        hasMoveRef.current = true;
        clearLongPressTimer();
        releasePressedButton();
        isDoubleTapCandidateRef.current = false;
        return;
      }

      // Handle two-finger scroll first
      if (e.touches.length > 1) {
        isMultiTouchRef.current = true;
        hasMoveRef.current = true;
        clearLongPressTimer();
        releasePressedButton();

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

      if (isMultiTouchRef.current) {
        return;
      }

      const deltaX = touch.clientX - touchStartPosRef.current.x;
      const deltaY = touch.clientY - touchStartPosRef.current.y;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance > TAP_THRESHOLD) {
        hasMoveRef.current = true;
        clearLongPressTimer();
      }

      if (
        isDoubleTapCandidateRef.current &&
        distance > DRAG_THRESHOLD &&
        !isDraggingRef.current &&
        !isLongPressRef.current &&
        coordinate !== null
      ) {
        isDraggingRef.current = true;
        pressedButtonRef.current = MouseButton.Left;
        handleMouseEvent({ type: 'mousedown', button: MouseButton.Left });
      }

      if (!isDoubleTapCandidateRef.current || isDraggingRef.current || isLongPressRef.current) {
        if (coordinate !== null) {
          handleMouseEvent({ type: 'move', x: coordinate.x, y: coordinate.y });
        }
      }
    }

    // Mouse touch end event
    function handleTouchEnd(e: TouchEvent) {
      disableEvent(e);

      if (!isTouchActiveRef.current) {
        if (e.touches.length === 0) {
          isTouchActiveRef.current = false;
          isMultiTouchRef.current = false;
        }
        return;
      }

      if (e.touches.length > 0) {
        isMultiTouchRef.current = true;
        return;
      }

      clearLongPressTimer();

      const endTouch = e.changedTouches[0];
      const isTap =
        !isMultiTouchRef.current &&
        !hasMoveRef.current &&
        !isLongPressRef.current &&
        !isDraggingRef.current &&
        !!endTouch &&
        !!getCorrectedCoords(endTouch.clientX, endTouch.clientY);

      if (isTap) {
        handleMouseEvent({ type: 'mousedown', button: MouseButton.Left });
        handleMouseEvent({ type: 'mouseup', button: MouseButton.Left });
        const currentTime = Date.now();
        lastTapTimeRef.current = currentTime;
        lastTapPosRef.current = { x: endTouch.clientX, y: endTouch.clientY };
        if (isDoubleTapCandidateRef.current) {
          doubleTapDragArmedUntilRef.current = currentTime + DOUBLE_TAP_DRAG_WINDOW;
        }
      } else if (pressedButtonRef.current !== null) {
        flushMouseMove();
        releasePressedButton();
        doubleTapDragArmedUntilRef.current = 0;
      }

      isLongPressRef.current = false;
      hasMoveRef.current = false;
      isDraggingRef.current = false;
      isMultiTouchRef.current = false;
      isTouchActiveRef.current = false;
      isDoubleTapCandidateRef.current = false;
    }

    // Mouse touch cancel event
    function handleTouchCancel(e: TouchEvent) {
      disableEvent(e);

      clearLongPressTimer();

      releasePressedButton();

      isLongPressRef.current = false;
      hasMoveRef.current = false;
      isDraggingRef.current = false;
      isMultiTouchRef.current = false;
      isTouchActiveRef.current = false;
      pressedButtonRef.current = null;
      isDoubleTapCandidateRef.current = false;
      doubleTapDragArmedUntilRef.current = 0;
      lastTapTimeRef.current = 0;
    }

    // get mouse coordinate
    function getCoordinate(event: MouseEvent | Touch): { x: number; y: number } | null {
      const correctedCoords = getCorrectedCoords(event.clientX, event.clientY);
      if (!correctedCoords) {
        return null;
      }

      const { x, y } = correctedCoords;

      const finalX = Math.max(0, Math.min(1, x));
      const finalY = Math.max(0, Math.min(1, y));

      const hexX = Math.floor(0x7fff * finalX) + 0x0001;
      const hexY = Math.floor(0x7fff * finalY) + 0x0001;

      return { x: hexX, y: hexY };
    }

    function getCorrectedCoords(clientX: number, clientY: number): { x: number; y: number } | null {
      const viewport = target.parentElement;
      if (viewport?.id === 'screen-viewport' && viewport.dataset.cropped === 'true') {
        const viewportRect = viewport.getBoundingClientRect();
        if (
          viewportRect.width <= 0 ||
          viewportRect.height <= 0 ||
          clientX < viewportRect.left ||
          clientX > viewportRect.right ||
          clientY < viewportRect.top ||
          clientY > viewportRect.bottom
        ) {
          return null;
        }

        return {
          x: (clientX - viewportRect.left) / viewportRect.width,
          y: (clientY - viewportRect.top) / viewportRect.height
        };
      }

      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return null;
      }

      const mediaSize =
        getMediaSize(target) ||
        (resolution && resolution.width > 0 && resolution.height > 0 ? resolution : null);
      if (!mediaSize) {
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        return { x, y };
      }

      const renderedMediaRect = getRenderedMediaRect(rect, mediaSize);
      const frameContent = getEffectiveFrameContent(mediaSize);
      const frameScaleX = renderedMediaRect.width / mediaSize.width;
      const frameScaleY = renderedMediaRect.height / mediaSize.height;
      const contentLeft = renderedMediaRect.left + frameContent.left * frameScaleX;
      const contentTop = renderedMediaRect.top + frameContent.top * frameScaleY;
      const contentWidth = frameContent.width * frameScaleX;
      const contentHeight = frameContent.height * frameScaleY;

      if (
        clientX < contentLeft ||
        clientX > contentLeft + contentWidth ||
        clientY < contentTop ||
        clientY > contentTop + contentHeight
      ) {
        return null;
      }

      const x = (clientX - contentLeft) / contentWidth;
      const y = (clientY - contentTop) / contentHeight;

      return { x, y };
    }

    function getEffectiveFrameContent(mediaSize: MediaSize): FrameContent {
      return (
        (inputRegion && getConfiguredFrameContent(inputRegion, mediaSize)) ||
        fullFrameContent(mediaSize)
      );
    }

    function queueMouseMove(x: number, y: number) {
      pendingMove = { x, y };
      if (moveFrame !== null) {
        return;
      }

      moveFrame = requestAnimationFrame(() => {
        moveFrame = null;
        flushMouseMove();
      });
    }

    function flushMouseMove() {
      if (moveFrame !== null) {
        cancelAnimationFrame(moveFrame);
        moveFrame = null;
      }
      if (pendingMove === null) {
        return;
      }

      const move = pendingMove;
      pendingMove = null;
      handleMouseEvent({ type: 'move', x: move.x, y: move.y });
    }

    function clearLongPressTimer() {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    function releasePressedButton() {
      if (pressedButtonRef.current === null) {
        return;
      }

      flushMouseMove();
      handleMouseEvent({ type: 'mouseup', button: pressedButtonRef.current });
      pressedButtonRef.current = null;
      isDraggingRef.current = false;
      isLongPressRef.current = false;
    }

    return () => {
      if (moveFrame !== null) {
        cancelAnimationFrame(moveFrame);
      }
      sendReport(mouse.reset(lastPosRef.current.x, lastPosRef.current.y));
      target.removeEventListener('mousemove', handleMouseMove);
      target.removeEventListener('mousedown', handleMouseDown);
      target.removeEventListener('mouseup', handleMouseUp);
      target.removeEventListener('wheel', handleWheel);
      target.removeEventListener('click', disableEvent);
      target.removeEventListener('contextmenu', disableEvent);
      target.removeEventListener('touchstart', handleTouchStart, touchOptions.capture);
      target.removeEventListener('touchmove', handleTouchMove, touchOptions.capture);
      target.removeEventListener('touchend', handleTouchEnd, touchOptions.capture);
      target.removeEventListener('touchcancel', handleTouchCancel, touchOptions.capture);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [inputRegion, resolution, scrollDirection, scrollInterval]);

  // disable default events
  function disableEvent(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  return <></>;
};

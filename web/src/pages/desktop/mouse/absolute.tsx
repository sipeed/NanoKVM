import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';

import { MouseReportAbsolute } from '@/lib/mouse.ts';
import { client, MessageEvent } from '@/lib/websocket.ts';
import { scrollDirectionAtom, scrollIntervalAtom } from '@/jotai/mouse.ts';
import { resolutionAtom } from '@/jotai/screen.ts';

import { MouseAbsoluteEvent } from './types.ts';

type MediaSize = {
  width: number;
  height: number;
};

type FrameContent = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const fullFrameContent = (mediaSize: MediaSize): FrameContent => ({
  left: 0,
  top: 0,
  width: mediaSize.width,
  height: mediaSize.height
});

enum MouseButton {
  Left = 0,
  Middle = 1,
  Right = 2,
  Back = 3,
  Forward = 4
}

export const Absolute = () => {
  const resolution = useAtomValue(resolutionAtom);
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
    let frameContentCache: { key: string; checkedAt: number; content: FrameContent } | null = null;
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
    target.addEventListener('load', invalidateFrameContent);
    target.addEventListener('loadedmetadata', invalidateFrameContent);
    target.addEventListener('canplay', invalidateFrameContent);

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
      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return null;
      }

      const mediaSize =
        resolution && resolution.width > 0 && resolution.height > 0
          ? resolution
          : getMediaSize(target);
      if (!mediaSize) {
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        return { x, y };
      }

      const mediaRatio = mediaSize.width / mediaSize.height;
      const elementRatio = rect.width / rect.height;

      let renderedWidth = rect.width;
      let renderedHeight = rect.height;
      let offsetX = 0;
      let offsetY = 0;

      if (mediaRatio > elementRatio) {
        renderedHeight = rect.width / mediaRatio;
        offsetY = (rect.height - renderedHeight) / 2;
      } else {
        renderedWidth = rect.height * mediaRatio;
        offsetX = (rect.width - renderedWidth) / 2;
      }

      const frameContent = getFrameContent(mediaSize);
      const frameScaleX = renderedWidth / mediaSize.width;
      const frameScaleY = renderedHeight / mediaSize.height;
      const contentLeft = rect.left + offsetX + frameContent.left * frameScaleX;
      const contentTop = rect.top + offsetY + frameContent.top * frameScaleY;
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

    function invalidateFrameContent() {
      frameContentCache = null;
    }

    function getFrameContent(mediaSize: MediaSize): FrameContent {
      const key = `${mediaSize.width}x${mediaSize.height}`;
      const now = performance.now();
      if (frameContentCache?.key === key && now - frameContentCache.checkedAt < 1000) {
        return frameContentCache.content;
      }

      const content = detectFrameContent(target, mediaSize);
      frameContentCache = { key, checkedAt: now, content };
      return content;
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
      target.removeEventListener('load', invalidateFrameContent);
      target.removeEventListener('loadedmetadata', invalidateFrameContent);
      target.removeEventListener('canplay', invalidateFrameContent);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [resolution, scrollDirection, scrollInterval]);

  // disable default events
  function disableEvent(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  return <></>;
};

function detectFrameContent(screen: Element, mediaSize: MediaSize): FrameContent {
  // Frame metadata includes letterbox pixels; infer stable side borders until the capture pipeline exposes an active rect.
  // ponytail: replace pixel inference with active-content metadata when available.
  const sampleScale = Math.min(1, 640 / mediaSize.width, 360 / mediaSize.height);
  const sampleWidth = Math.max(1, Math.round(mediaSize.width * sampleScale));
  const sampleHeight = Math.max(1, Math.round(mediaSize.height * sampleScale));
  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || !drawMediaFrame(context, screen, sampleWidth, sampleHeight)) {
    return fullFrameContent(mediaSize);
  }

  try {
    const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
    const left = findBorderInset(pixels, sampleWidth, sampleHeight, true);
    const right = findBorderInset(pixels, sampleWidth, sampleHeight, false);
    const minHorizontalBorder = Math.max(4, Math.round(sampleWidth * 0.02));
    const horizontalBorder =
      left >= minHorizontalBorder &&
      right >= minHorizontalBorder &&
      left + right < sampleWidth * 0.4 &&
      Math.abs(left - right) <= Math.max(4, Math.round(sampleWidth * 0.05));
    const frameLeft = horizontalBorder ? (left / sampleWidth) * mediaSize.width : 0;
    const frameRight = horizontalBorder ? (right / sampleWidth) * mediaSize.width : 0;

    return {
      left: frameLeft,
      top: 0,
      width: mediaSize.width - frameLeft - frameRight,
      height: mediaSize.height
    };
  } catch {
    return fullFrameContent(mediaSize);
  }
}

function drawMediaFrame(
  context: CanvasRenderingContext2D,
  screen: Element,
  width: number,
  height: number
) {
  if (
    screen instanceof HTMLVideoElement ||
    screen instanceof HTMLImageElement ||
    screen instanceof HTMLCanvasElement
  ) {
    try {
      context.drawImage(screen, 0, 0, width, height);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

function findBorderInset(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  fromStart: boolean
) {
  const lines = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((ratio) =>
    Math.round((height - 1) * ratio)
  );
  const limit = Math.floor(width * 0.45);
  let inset = 0;

  for (let offset = 0; offset < limit; offset++) {
    const position = fromStart ? offset : width - offset - 1;
    const samples = lines.map((line) => getPixel(pixels, width, position, line));
    if (!samples.every(isBlackPixel)) {
      break;
    }

    inset = offset + 1;
  }

  return inset;
}

function getPixel(pixels: Uint8ClampedArray, width: number, x: number, y: number) {
  const offset = (y * width + x) * 4;
  return [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
}

function isBlackPixel(pixel: number[]) {
  return pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0;
}

function getMediaSize(screen: Element): MediaSize | null {
  if (screen instanceof HTMLVideoElement && screen.videoWidth > 0 && screen.videoHeight > 0) {
    return { width: screen.videoWidth, height: screen.videoHeight };
  }

  if (screen instanceof HTMLImageElement && screen.naturalWidth > 0 && screen.naturalHeight > 0) {
    return { width: screen.naturalWidth, height: screen.naturalHeight };
  }

  if (screen instanceof HTMLCanvasElement) {
    const width = Number(screen.dataset.mediaWidth);
    const height = Number(screen.dataset.mediaHeight);
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }

  return null;
}

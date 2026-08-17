import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { resolveInputAdapter } from '@/lib/input-adapter.ts';
import { MouseReportRelative } from '@/lib/mouse.ts';
import { client, MessageEvent } from '@/lib/websocket.ts';
import { inputAdapterAtom, scrollDirectionAtom, scrollIntervalAtom } from '@/jotai/mouse.ts';
import { resolutionAtom } from '@/jotai/screen.ts';

import { MouseRelativeEvent } from './types.ts';

export const Relative = () => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const resolution = useAtomValue(resolutionAtom);
  const scrollDirection = useAtomValue(scrollDirectionAtom);
  const scrollInterval = useAtomValue(scrollIntervalAtom);
  const inputAdapter = useAtomValue(inputAdapterAtom);
  const effectiveAdapter = resolveInputAdapter(inputAdapter, 'relative');

  const mouseRef = useRef(new MouseReportRelative());
  const isLockedRef = useRef(false);
  const lastScrollTimeRef = useRef(0);
  const lastTouchPosRef = useRef({ x: 0, y: 0 });
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const touchIdentifierRef = useRef<number | null>(null);
  const pendingTouchDeltaRef = useRef({ x: 0, y: 0 });
  const touchLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouchLongPressRef = useRef(false);
  const hasTouchMoveRef = useRef(false);
  const isMultiTouchRef = useRef(false);
  const pressedTouchButtonRef = useRef<number | null>(null);
  const lastTouchEndTimeRef = useRef(0);

  const TAP_THRESHOLD = 8;
  const LONG_PRESS_DELAY = 800;

  useEffect(() => {
    const screen = document.getElementById('screen');
    if (!screen) return;
    const target = screen;
    const mouse = mouseRef.current;
    const useTouchpad = effectiveAdapter === 'touchpad';
    const previousTouchAction = target.style.touchAction;

    if (!useTouchpad) {
      showMessage();
    } else {
      // Touchpad mode must never trap the user's pointer.
      if (document.pointerLockElement === target) {
        document.exitPointerLock();
      }
      isLockedRef.current = false;
      target.style.touchAction = 'none';
    }

    if (!useTouchpad) {
      target.addEventListener('click', handleMouseClick);
    }
    target.addEventListener('mousedown', handleMouseDown);
    target.addEventListener('mouseup', handleMouseUp);
    target.addEventListener('mousemove', handleMouseMove);
    target.addEventListener('wheel', handleMouseWheel, { passive: false });
    target.addEventListener('contextmenu', disableEvent);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    const touchOptions: AddEventListenerOptions = { passive: false };
    if (useTouchpad) {
      target.addEventListener('touchstart', handleTouchStart, touchOptions);
      target.addEventListener('touchmove', handleTouchMove, touchOptions);
      target.addEventListener('touchend', handleTouchEnd, touchOptions);
      target.addEventListener('touchcancel', handleTouchCancel, touchOptions);
      window.addEventListener('blur', releaseTouchpadState);
      window.addEventListener('pagehide', releaseTouchpadState);
    }

    // Mouse click event
    function handleMouseClick(event: MouseEvent) {
      disableEvent(event);

      if (Date.now() - lastTouchEndTimeRef.current < 500) {
        return;
      }

      if (!isLockedRef.current && 'requestPointerLock' in target) {
        const requestPointerLock = (
          target as HTMLElement & {
            requestPointerLock?: () => Promise<void> | void;
          }
        ).requestPointerLock;
        requestPointerLock?.call(target)?.catch?.(() => undefined);
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

    // Touch start event
    function handleTouchStart(e: TouchEvent) {
      disableEvent(e);

      if (e.touches.length === 0) {
        return;
      }

      if (e.touches.length > 1) {
        isMultiTouchRef.current = true;
        hasTouchMoveRef.current = true;
        clearTouchLongPressTimer();
        releasePressedTouchButton();
        lastTouchPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
        return;
      }

      const touch = e.touches[0];
      touchIdentifierRef.current = touch.identifier;
      lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      pendingTouchDeltaRef.current = { x: 0, y: 0 };
      isTouchLongPressRef.current = false;
      hasTouchMoveRef.current = false;
      isMultiTouchRef.current = e.touches.length > 1;
      releasePressedTouchButton();
      pressedTouchButtonRef.current = null;

      clearTouchLongPressTimer();

      touchLongPressTimerRef.current = setTimeout(() => {
        isTouchLongPressRef.current = true;
        pressedTouchButtonRef.current = 0;
        navigator.vibrate?.(50);
        handleMouseEvent({ type: 'mousedown', button: 0 });
      }, LONG_PRESS_DELAY);
    }

    // Touch move event
    function handleTouchMove(e: TouchEvent) {
      disableEvent(e);

      if (e.touches.length === 0) {
        return;
      }

      if (e.touches.length > 1) {
        isMultiTouchRef.current = true;
        hasTouchMoveRef.current = true;
        pendingTouchDeltaRef.current = { x: 0, y: 0 };
        clearTouchLongPressTimer();
        releasePressedTouchButton();
      }

      const touch =
        Array.from(e.touches).find((item) => item.identifier === touchIdentifierRef.current) ??
        e.touches[0];
      const deltaX = touch.clientX - lastTouchPosRef.current.x;
      const deltaY = touch.clientY - lastTouchPosRef.current.y;
      lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };

      if (e.touches.length > 1) {
        const currentTime = Date.now();
        if (currentTime - lastScrollTimeRef.current >= scrollInterval && deltaY !== 0) {
          const wheel = (deltaY > 0 ? 1 : -1) * scrollDirection;
          handleMouseEvent({ type: 'wheel', deltaY: wheel });
          lastScrollTimeRef.current = currentTime;
        }
        return;
      }

      if (isMultiTouchRef.current) {
        return;
      }

      const totalDeltaX = touch.clientX - touchStartPosRef.current.x;
      const totalDeltaY = touch.clientY - touchStartPosRef.current.y;
      const distance = Math.hypot(totalDeltaX, totalDeltaY);

      pendingTouchDeltaRef.current.x += deltaX;
      pendingTouchDeltaRef.current.y += deltaY;

      if (distance > TAP_THRESHOLD) {
        hasTouchMoveRef.current = true;
        clearTouchLongPressTimer();
      }

      if (pendingTouchDeltaRef.current.x !== 0 || pendingTouchDeltaRef.current.y !== 0) {
        handleMouseEvent({
          type: 'move',
          deltaX: scaleTouchMovement(pendingTouchDeltaRef.current.x),
          deltaY: scaleTouchMovement(pendingTouchDeltaRef.current.y)
        });
        pendingTouchDeltaRef.current = { x: 0, y: 0 };
      }
    }

    // Touch end event
    function handleTouchEnd(e: TouchEvent) {
      disableEvent(e);
      lastTouchEndTimeRef.current = Date.now();

      if (e.touches.length > 0) {
        isMultiTouchRef.current = true;
        return;
      }

      clearTouchLongPressTimer();

      const isTap =
        !isMultiTouchRef.current &&
        !hasTouchMoveRef.current &&
        !isTouchLongPressRef.current &&
        pressedTouchButtonRef.current === null;

      if (isTap) {
        handleMouseEvent({ type: 'mousedown', button: 0 });
        handleMouseEvent({ type: 'mouseup', button: 0 });
      } else if (pressedTouchButtonRef.current !== null) {
        releasePressedTouchButton();
      }

      resetTouchState();
    }

    // Touch cancel event
    function handleTouchCancel(e: TouchEvent) {
      disableEvent(e);
      clearTouchLongPressTimer();

      releasePressedTouchButton();

      resetTouchState();
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
      isLockedRef.current = document.pointerLockElement === target;
    }

    function releaseTouchpadState() {
      clearTouchLongPressTimer();
      releasePressedTouchButton();
      resetTouchState();
    }

    return () => {
      const release = mouse.reset();
      client.send(new Uint8Array([MessageEvent.Mouse, ...release]));
      if (!useTouchpad) {
        target.removeEventListener('click', handleMouseClick);
      }
      target.removeEventListener('mousemove', handleMouseMove);
      target.removeEventListener('mousedown', handleMouseDown);
      target.removeEventListener('mouseup', handleMouseUp);
      target.removeEventListener('wheel', handleMouseWheel);
      target.removeEventListener('contextmenu', disableEvent);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      if (useTouchpad) {
        target.style.touchAction = previousTouchAction;
        target.removeEventListener('touchstart', handleTouchStart, touchOptions.capture);
        target.removeEventListener('touchmove', handleTouchMove, touchOptions.capture);
        target.removeEventListener('touchend', handleTouchEnd, touchOptions.capture);
        target.removeEventListener('touchcancel', handleTouchCancel, touchOptions.capture);
        window.removeEventListener('blur', releaseTouchpadState);
        window.removeEventListener('pagehide', releaseTouchpadState);
        releaseTouchpadState();
      }
    };
  }, [effectiveAdapter, resolution, scrollDirection, scrollInterval]);

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
  function disableEvent(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function scaleTouchMovement(value: number) {
    return Math.abs(value * window.devicePixelRatio) < 10 ? value * 2 : value;
  }

  function clearTouchLongPressTimer() {
    if (touchLongPressTimerRef.current) {
      clearTimeout(touchLongPressTimerRef.current);
      touchLongPressTimerRef.current = null;
    }
  }

  function resetTouchState() {
    touchIdentifierRef.current = null;
    pendingTouchDeltaRef.current = { x: 0, y: 0 };
    isTouchLongPressRef.current = false;
    hasTouchMoveRef.current = false;
    isMultiTouchRef.current = false;
    pressedTouchButtonRef.current = null;
  }

  function releasePressedTouchButton() {
    if (pressedTouchButtonRef.current === null) {
      return;
    }

    handleMouseEvent({ type: 'mouseup', button: pressedTouchButtonRef.current });
    pressedTouchButtonRef.current = null;
    isTouchLongPressRef.current = false;
  }

  return <>{contextHolder}</>;
};

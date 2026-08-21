import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { HolderOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, theme } from 'antd';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import Draggable from 'react-draggable';
import { useTranslation } from 'react-i18next';

import { setInputRegionConfig } from '@/api/vm.ts';
import { InputRegion } from '@/types';
import { keyboardLockAtom } from '@/jotai/keyboard.ts';
import {
  inputRegionAtom,
  inputRegionSelectingAtom,
  manualInputRegionAtom,
  selectedOriginalResolutionAtom,
  videoScaleAtom
} from '@/jotai/screen.ts';

import { getMediaSize, getRenderedMediaRect, MediaSize, RenderedMediaRect } from './geometry.ts';

type SelectionRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

const resizeHandles: Array<{
  handle: ResizeHandle;
  className: string;
  cursor: string;
}> = [
  {
    handle: 'n',
    className: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2',
    cursor: 'ns-resize'
  },
  {
    handle: 'ne',
    className: 'right-0 top-0 translate-x-1/2 -translate-y-1/2',
    cursor: 'nesw-resize'
  },
  {
    handle: 'e',
    className: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
    cursor: 'ew-resize'
  },
  {
    handle: 'se',
    className: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
    cursor: 'nwse-resize'
  },
  {
    handle: 's',
    className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
    cursor: 'ns-resize'
  },
  {
    handle: 'sw',
    className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
    cursor: 'nesw-resize'
  },
  {
    handle: 'w',
    className: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
    cursor: 'ew-resize'
  },
  {
    handle: 'nw',
    className: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2',
    cursor: 'nwse-resize'
  }
];

const minimumSelectionSize = 4;

export const InputRegionOverlay = () => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [selecting, setSelecting] = useAtom(inputRegionSelectingAtom);
  const [, setInputRegionState] = useAtom(inputRegionAtom);
  const setManualInputRegion = useSetAtom(manualInputRegionAtom);
  const setSelectedOriginalResolution = useSetAtom(selectedOriginalResolutionAtom);
  const videoScale = useAtomValue(videoScaleAtom);
  const setVideoScale = useSetAtom(videoScaleAtom);
  const setKeyboardLock = useSetAtom(keyboardLockAtom);
  const [frameRect, setFrameRect] = useState<RenderedMediaRect | null>(null);
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [cursorPoint, setCursorPoint] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeRef = useRef<{
    handle: ResizeHandle;
    selection: SelectionRect;
  } | null>(null);
  const moveRef = useRef<{
    start: { x: number; y: number };
    selection: SelectionRect;
  } | null>(null);
  const frameRectRef = useRef<RenderedMediaRect | null>(null);
  const cursorPointRef = useRef<{ x: number; y: number } | null>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const previousVideoScaleRef = useRef(videoScale);

  if (!selecting) {
    previousVideoScaleRef.current = videoScale;
  }

  const cancelSelection = useCallback(() => {
    dragStartRef.current = null;
    resizeRef.current = null;
    moveRef.current = null;
    setDragging(false);
    setSelection(null);
    setError('');
    cursorPointRef.current = null;
    setCursorPoint(null);
    setSelecting(false);
  }, [setSelecting]);

  useEffect(() => {
    return () => setSelecting(false);
  }, [setSelecting]);

  useEffect(() => {
    if (!selecting) {
      return;
    }

    setKeyboardLock({ source: 'input-region-selector', locked: true });
    return () => setKeyboardLock({ source: 'input-region-selector', locked: false });
  }, [selecting, setKeyboardLock]);

  useEffect(() => {
    if (!selecting) {
      return;
    }

    const previousScale = previousVideoScaleRef.current;
    setVideoScale(0.75);
    return () => setVideoScale(previousScale);
  }, [selecting, setVideoScale]);

  useEffect(() => {
    if (!selecting) {
      return;
    }

    const screen = document.getElementById('screen');
    if (!screen) {
      setFrameRect(null);
      setMediaSize(null);
      frameRectRef.current = null;
      return;
    }
    const target = screen;

    function updateFrame() {
      const nextMediaSize = getMediaSize(target);
      const bounds = target.getBoundingClientRect();
      if (!nextMediaSize || bounds.width <= 0 || bounds.height <= 0) {
        setFrameRect(null);
        setMediaSize(null);
        frameRectRef.current = null;
        return;
      }

      const nextFrameRect = getRenderedMediaRect(bounds, nextMediaSize);
      const previousFrameRect = frameRectRef.current;
      if (
        previousFrameRect &&
        (previousFrameRect.left !== nextFrameRect.left ||
          previousFrameRect.top !== nextFrameRect.top ||
          previousFrameRect.width !== nextFrameRect.width ||
          previousFrameRect.height !== nextFrameRect.height)
      ) {
        dragStartRef.current = null;
        resizeRef.current = null;
        moveRef.current = null;
        setDragging(false);
        setSelection(null);
      }

      setMediaSize(nextMediaSize);
      setFrameRect(nextFrameRect);
      frameRectRef.current = nextFrameRect;
    }

    updateFrame();
    const resizeObserver = new ResizeObserver(updateFrame);
    resizeObserver.observe(target);
    const mutationObserver = new MutationObserver(updateFrame);
    mutationObserver.observe(target, {
      attributes: true,
      attributeFilter: ['data-media-width', 'data-media-height']
    });
    window.addEventListener('resize', updateFrame);
    window.addEventListener('scroll', updateFrame, true);
    target.addEventListener('load', updateFrame);
    target.addEventListener('loadedmetadata', updateFrame);
    target.addEventListener('canplay', updateFrame);
    target.addEventListener('resize', updateFrame);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', updateFrame);
      window.removeEventListener('scroll', updateFrame, true);
      target.removeEventListener('load', updateFrame);
      target.removeEventListener('loadedmetadata', updateFrame);
      target.removeEventListener('canplay', updateFrame);
      target.removeEventListener('resize', updateFrame);
    };
  }, [selecting, videoScale]);

  useEffect(() => {
    if (!selecting) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        cancelSelection();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cancelSelection, selecting]);

  const hasCursorPoint = cursorPoint !== null;

  useEffect(() => {
    if (!selecting || !frameRect || !mediaSize || !hasCursorPoint) {
      return;
    }

    const canvas = magnifierCanvasRef.current;
    const screen = document.getElementById('screen');
    if (!canvas || !screen) {
      return;
    }

    if (
      !(
        screen instanceof HTMLVideoElement ||
        screen instanceof HTMLImageElement ||
        screen instanceof HTMLCanvasElement
      )
    ) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    const target = screen;
    const drawingContext = context;
    const currentFrameRect = frameRect;
    const currentMediaSize = mediaSize;

    const magnifierWidth = 180;
    const magnifierHeight = 130;
    const zoom = 3;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = magnifierWidth * pixelRatio;
    canvas.height = magnifierHeight * pixelRatio;

    let animationFrame = 0;
    function renderMagnifier() {
      const point = cursorPointRef.current;
      if (!point) {
        return;
      }

      const mediaX =
        ((point.x - currentFrameRect.left) / currentFrameRect.width) * currentMediaSize.width;
      const mediaY =
        ((point.y - currentFrameRect.top) / currentFrameRect.height) * currentMediaSize.height;
      const sourceWidth = Math.min(currentMediaSize.width, magnifierWidth / zoom);
      const sourceHeight = Math.min(currentMediaSize.height, magnifierHeight / zoom);
      const unclippedLeft = mediaX - sourceWidth / 2;
      const unclippedTop = mediaY - sourceHeight / 2;
      const sourceLeft = Math.max(0, unclippedLeft);
      const sourceTop = Math.max(0, unclippedTop);
      const sourceRight = Math.min(currentMediaSize.width, unclippedLeft + sourceWidth);
      const sourceBottom = Math.min(currentMediaSize.height, unclippedTop + sourceHeight);
      const clippedWidth = sourceRight - sourceLeft;
      const clippedHeight = sourceBottom - sourceTop;
      const destinationLeft = (sourceLeft - unclippedLeft) * zoom;
      const destinationTop = (sourceTop - unclippedTop) * zoom;

      drawingContext.save();
      drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawingContext.clearRect(0, 0, magnifierWidth, magnifierHeight);
      drawingContext.fillStyle = '#111827';
      drawingContext.fillRect(0, 0, magnifierWidth, magnifierHeight);
      drawingContext.imageSmoothingEnabled = true;

      try {
        drawingContext.drawImage(
          target,
          sourceLeft,
          sourceTop,
          clippedWidth,
          clippedHeight,
          destinationLeft,
          destinationTop,
          clippedWidth * zoom,
          clippedHeight * zoom
        );
      } catch {
        drawingContext.fillStyle = '#f9fafb';
        drawingContext.font = '12px sans-serif';
        drawingContext.textAlign = 'center';
        drawingContext.fillText(
          t('screen.controlRegion.previewUnavailable'),
          magnifierWidth / 2,
          magnifierHeight / 2
        );
      }

      drawingContext.restore();
      animationFrame = requestAnimationFrame(renderMagnifier);
    }

    renderMagnifier();
    return () => cancelAnimationFrame(animationFrame);
  }, [frameRect, hasCursorPoint, mediaSize, selecting, t]);

  if (!selecting) {
    return null;
  }

  function clampPoint(x: number, y: number) {
    if (!frameRect) {
      return null;
    }

    return {
      x: Math.max(frameRect.left, Math.min(frameRect.left + frameRect.width, x)),
      y: Math.max(frameRect.top, Math.min(frameRect.top + frameRect.height, y))
    };
  }

  function updateSelection(x: number, y: number) {
    const start = dragStartRef.current;
    const point = clampPoint(x, y);
    if (!start || !point) {
      return;
    }

    setSelection({
      left: Math.min(start.x, point.x),
      top: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y)
    });
  }

  function updateResizedSelection(x: number, y: number) {
    if (!frameRect || !resizeRef.current) {
      return;
    }

    const { handle, selection: initial } = resizeRef.current;
    let left = initial.left;
    let top = initial.top;
    let right = initial.left + initial.width;
    let bottom = initial.top + initial.height;

    if (handle.includes('w')) {
      left = Math.max(frameRect.left, Math.min(right - minimumSelectionSize, x));
    }
    if (handle.includes('e')) {
      right = Math.min(frameRect.left + frameRect.width, Math.max(left + minimumSelectionSize, x));
    }
    if (handle.includes('n')) {
      top = Math.max(frameRect.top, Math.min(bottom - minimumSelectionSize, y));
    }
    if (handle.includes('s')) {
      bottom = Math.min(frameRect.top + frameRect.height, Math.max(top + minimumSelectionSize, y));
    }

    const nextSelection = { left, top, width: right - left, height: bottom - top };
    setSelection(nextSelection);
    updateCursorPoint(
      handle.includes('w') ? left : handle.includes('e') ? right : left + nextSelection.width / 2,
      handle.includes('n') ? top : handle.includes('s') ? bottom : top + nextSelection.height / 2,
      true
    );
  }

  function updateMovedSelection(x: number, y: number) {
    if (!frameRect || !moveRef.current) {
      return;
    }

    const { start, selection: initial } = moveRef.current;
    const left = Math.max(
      frameRect.left,
      Math.min(frameRect.left + frameRect.width - initial.width, initial.left + x - start.x)
    );
    const top = Math.max(
      frameRect.top,
      Math.min(frameRect.top + frameRect.height - initial.height, initial.top + y - start.y)
    );

    setSelection({ ...initial, left, top });
  }

  function updateCursorPoint(x: number, y: number, force = false) {
    if (
      !frameRect ||
      x < frameRect.left ||
      x > frameRect.left + frameRect.width ||
      y < frameRect.top ||
      y > frameRect.top + frameRect.height
    ) {
      cursorPointRef.current = null;
      setCursorPoint(null);
      return;
    }

    if (
      !force &&
      selection &&
      x >= selection.left &&
      x <= selection.left + selection.width &&
      y >= selection.top &&
      y <= selection.top + selection.height
    ) {
      cursorPointRef.current = null;
      setCursorPoint(null);
      return;
    }

    const point = { x, y };
    cursorPointRef.current = point;
    setCursorPoint(point);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (
      !frameRect ||
      event.clientX < frameRect.left ||
      event.clientX > frameRect.left + frameRect.width ||
      event.clientY < frameRect.top ||
      event.clientY > frameRect.top + frameRect.height
    ) {
      return;
    }

    const point = clampPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    updateCursorPoint(event.clientX, event.clientY, true);
    resizeRef.current = null;
    moveRef.current = null;
    dragStartRef.current = point;
    setSelection({ left: point.x, top: point.y, width: 0, height: 0 });
    setDragging(true);
    setError('');
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (moveRef.current) {
      cursorPointRef.current = null;
      setCursorPoint(null);
    } else if (resizeRef.current) {
      updateResizedSelection(event.clientX, event.clientY);
    } else {
      updateCursorPoint(event.clientX, event.clientY, dragging);
      if (dragging) {
        updateSelection(event.clientX, event.clientY);
      }
    }
    if (moveRef.current) {
      updateMovedSelection(event.clientX, event.clientY);
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (moveRef.current) {
      updateMovedSelection(event.clientX, event.clientY);
      moveRef.current = null;
      return;
    }
    if (resizeRef.current) {
      updateResizedSelection(event.clientX, event.clientY);
      resizeRef.current = null;
      cursorPointRef.current = null;
      setCursorPoint(null);
      return;
    }
    if (!dragging) {
      return;
    }

    updateSelection(event.clientX, event.clientY);
    cursorPointRef.current = null;
    setCursorPoint(null);
    dragStartRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleResizeStart(
    event: PointerEvent<HTMLDivElement>,
    handle: ResizeHandle,
    currentSelection: SelectionRect
  ) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = null;
    setDragging(false);
    resizeRef.current = { handle, selection: currentSelection };
    moveRef.current = null;
    updateResizedSelection(event.clientX, event.clientY);
    setError('');
  }

  function handleMoveStart(event: PointerEvent<HTMLDivElement>, currentSelection: SelectionRect) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = null;
    resizeRef.current = null;
    setDragging(false);
    moveRef.current = {
      start: { x: event.clientX, y: event.clientY },
      selection: currentSelection
    };
    cursorPointRef.current = null;
    setCursorPoint(null);
    setError('');
  }

  async function confirm() {
    if (!frameRect || !mediaSize || !selection) {
      return;
    }
    if (selection.width < minimumSelectionSize || selection.height < minimumSelectionSize) {
      setError(t('screen.controlRegion.tooSmall'));
      return;
    }

    const left = Math.round(
      ((selection.left - frameRect.left) / frameRect.width) * mediaSize.width
    );
    const top = Math.round(((selection.top - frameRect.top) / frameRect.height) * mediaSize.height);
    const right = Math.round(
      ((selection.left + selection.width - frameRect.left) / frameRect.width) * mediaSize.width
    );
    const bottom = Math.round(
      ((selection.top + selection.height - frameRect.top) / frameRect.height) * mediaSize.height
    );
    const region: InputRegion = {
      frameWidth: mediaSize.width,
      frameHeight: mediaSize.height,
      left,
      top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top)
    };

    const rsp = await setInputRegionConfig(region, '');
    if (rsp.code !== 0) {
      setError(t('screen.controlRegion.saveFailed'));
      return;
    }

    setManualInputRegion(region);
    setSelectedOriginalResolution('');
    setInputRegionState(region);
    cursorPointRef.current = null;
    setCursorPoint(null);
    setSelecting(false);
    setSelection(null);
  }

  const selectionStyle = selection
    ? {
        left: selection.left,
        top: selection.top,
        width: selection.width,
        height: selection.height
      }
    : undefined;

  const magnifierStyle = cursorPoint
    ? {
        left:
          cursorPoint.x + 24 + 180 > window.innerWidth ? cursorPoint.x - 204 : cursorPoint.x + 24,
        top:
          cursorPoint.y + 24 + 130 > window.innerHeight ? cursorPoint.y - 154 : cursorPoint.y + 24
      }
    : undefined;

  return (
    <div
      className="fixed inset-0 z-[1100] touch-none select-none"
      style={{ background: token.colorBgMask }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={(event) => {
        updateCursorPoint(-1, -1);
        handlePointerUp(event);
      }}
      onPointerLeave={() => updateCursorPoint(-1, -1)}
    >
      {frameRect && (
        <div
          className="pointer-events-none fixed border border-dashed"
          style={{
            left: frameRect.left,
            top: frameRect.top,
            width: frameRect.width,
            height: frameRect.height,
            borderColor: token.colorTextSecondary
          }}
        />
      )}
      {selection && (
        <div
          className="pointer-events-auto fixed border"
          style={{
            ...selectionStyle,
            cursor: 'move',
            borderColor: token.colorPrimary,
            background: `color-mix(in srgb, ${token.colorPrimary} 18%, transparent)`,
            boxShadow: token.boxShadowSecondary
          }}
          onPointerDown={(event) => handleMoveStart(event, selection)}
        >
          {resizeHandles.map(({ handle, className, cursor }) => (
            <div
              key={handle}
              className={`pointer-events-auto absolute flex h-7 w-7 items-center justify-center ${className}`}
              style={{ cursor }}
              onPointerDown={(event) => handleResizeStart(event, handle, selection)}
            >
              <div
                className="h-3 w-3 rounded-full border-2"
                style={{
                  borderColor: token.colorBgContainer,
                  background: token.colorPrimary,
                  boxShadow: token.boxShadowTertiary
                }}
              />
            </div>
          ))}
        </div>
      )}
      {cursorPoint && (
        <Card
          size="small"
          className="pointer-events-none fixed z-[1110]"
          style={{
            ...magnifierStyle,
            width: 180,
            overflow: 'hidden',
            borderRadius: token.borderRadiusLG,
            borderColor: token.colorBorderSecondary,
            boxShadow: token.boxShadowSecondary
          }}
          styles={{
            body: {
              position: 'relative',
              width: 178,
              height: 128,
              overflow: 'hidden',
              padding: 0,
              background: token.colorBgElevated
            }
          }}
        >
          <canvas ref={magnifierCanvasRef} className="block h-full w-full" />
          <div
            className="absolute inset-y-0 left-1/2 w-px"
            style={{ background: token.colorPrimary }}
          />
          <div
            className="absolute inset-x-0 top-1/2 h-px"
            style={{ background: token.colorPrimary }}
          />
        </Card>
      )}
      <Draggable
        nodeRef={promptRef}
        bounds="parent"
        handle=".control-region-drag-handle"
        positionOffset={{ x: '-50%', y: '0%' }}
      >
        <div
          ref={promptRef}
          className="fixed left-1/2 top-5 z-[1120] max-w-[calc(100%-1rem)]"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Card
            size="small"
            title={
              <div className="control-region-drag-handle flex cursor-move items-center gap-2">
                <HolderOutlined />
                <span>{t('screen.controlRegion.dragHint')}</span>
              </div>
            }
            style={{ boxShadow: token.boxShadowSecondary }}
            styles={{ header: { minHeight: 36 }, body: { padding: 8 } }}
          >
            <Space direction="vertical" size="small">
              <Space size="small">
                <Button
                  size="small"
                  type="primary"
                  disabled={!selection || !mediaSize}
                  onClick={confirm}
                >
                  {t('screen.controlRegion.finish')}
                </Button>
                <Button size="small" onClick={cancelSelection}>
                  {t('screen.controlRegion.cancel')}
                </Button>
              </Space>
              {error && <Alert type="error" showIcon message={error} />}
            </Space>
          </Card>
        </div>
      </Draggable>
    </div>
  );
};

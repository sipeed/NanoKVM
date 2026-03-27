import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useAtom, useAtomValue } from 'jotai';
import { w3cwebsocket as W3cWebSocket } from 'websocket';

import * as storage from '@/lib/localstorage.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse';
import { resolutionAtom, videoScaleAtom } from '@/jotai/screen.ts';

import DirectWorker from './direct.worker.ts?worker';

export const H264Direct = () => {
  const resolution = useAtomValue(resolutionAtom);
  const mouseStyle = useAtomValue(mouseStyleAtom);
  const [videoScale, setVideoScale] = useAtom(videoScaleAtom);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const displayWidth = canvasSize?.width || resolution?.width;
  const displayHeight = canvasSize?.height || resolution?.height;
  const scaledWidth = displayWidth ? displayWidth * videoScale : undefined;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const scale = storage.getVideoScale();
    if (scale) {
      setVideoScale(scale);
    }
  }, [setVideoScale]);

  useEffect(() => {
    if (!window.VideoDecoder) {
      console.log('Error: WebCodecs API not supported.');
      return;
    }
    if (!canvasRef.current) {
      return;
    }

    const worker = new DirectWorker();
    workerRef.current = worker;

    const offscreen = canvasRef.current.transferControlToOffscreen();
    worker.postMessage({ type: 'h264', canvas: offscreen }, [offscreen]);

    const url = `${getBaseUrl('ws')}/api/stream/h264/direct`;
    const ws = new W3cWebSocket(url);
    ws.binaryType = 'arraybuffer';

    ws.onmessage = (event) => {
      try {
        worker.postMessage({ type: 'ws_message', data: event.data }, [event.data]);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = () => {
      worker.postMessage({ type: 'error' });
    };

    ws.onclose = () => {
      worker.postMessage({ type: 'close' });
    };

    return () => {
      if (ws.readyState === 1) {
        ws.close();
      }
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    let frameId = 0;

    const syncCanvasSize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        setCanvasSize((current) => {
          if (current?.width === canvas.width && current?.height === canvas.height) {
            return current;
          }

          return {
            width: canvas.width,
            height: canvas.height
          };
        });
      }

      frameId = window.requestAnimationFrame(syncCanvasSize);
    };

    frameId = window.requestAnimationFrame(syncCanvasSize);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden">
      <canvas
        id="screen"
        ref={canvasRef}
        className={clsx('block select-none', mouseStyle)}
        style={{
          width: scaledWidth ? `min(100%, ${scaledWidth}px)` : '100%',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio:
            displayWidth && displayHeight ? `${displayWidth} / ${displayHeight}` : undefined,
          objectFit: 'contain'
        }}
      ></canvas>
    </div>
  );
};

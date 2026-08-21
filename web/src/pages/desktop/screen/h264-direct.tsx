import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';

import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse';

import DirectWorker from './direct.worker.ts?worker';
import { ScreenViewport } from './viewport.tsx';

export const H264Direct = () => {
  const mouseStyle = useAtomValue(mouseStyleAtom);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

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
    const url = `${getBaseUrl('ws')}/api/stream/h264/direct`;
    worker.onmessage = (
      event: MessageEvent<{ type?: string; width?: number; height?: number }>
    ) => {
      const { type, width, height } = event.data;
      if (type !== 'frame-size' || !width || !height || !canvasRef.current) {
        return;
      }

      canvasRef.current.dataset.mediaWidth = String(width);
      canvasRef.current.dataset.mediaHeight = String(height);
    };
    worker.postMessage({ type: 'h264', canvas: offscreen, url }, [offscreen]);

    return () => {
      worker.postMessage({ type: 'stop' });
      worker.terminate();
    };
  }, []);

  return (
    <ScreenViewport>
      <canvas
        id="screen"
        ref={canvasRef}
        className={clsx('block touch-none select-none', mouseStyle)}
      ></canvas>
    </ScreenViewport>
  );
};

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useAtom, useAtomValue } from 'jotai';

import * as storage from '@/lib/localstorage.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse';
import { videoScaleAtom } from '@/jotai/screen.ts';

import DirectWorker from './direct.worker.ts?worker';

export const H264Direct = () => {
  const mouseStyle = useAtomValue(mouseStyleAtom);
  const [videoScale, setVideoScale] = useAtom(videoScaleAtom);

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
    <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden">
      <canvas
        id="screen"
        ref={canvasRef}
        className={clsx('block touch-none select-none', mouseStyle)}
        style={{
          transform: `scale(${videoScale})`,
          transformOrigin: 'center',
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      ></canvas>
    </div>
  );
};

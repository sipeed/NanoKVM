import { useEffect, useRef, useState } from 'react';
import { Alert } from 'antd';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { encoderCodecQuery, getEncoderCodec, isEncoderCodecSupported } from '@/lib/encoder.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse';

import DirectWorker from './direct.worker.ts?worker';
import { ScreenViewport } from './viewport.tsx';

export const H264Direct = () => {
  const { t } = useTranslation();
  const mouseStyle = useAtomValue(mouseStyleAtom);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const translationRef = useRef(t);

  useEffect(() => {
    translationRef.current = t;
  }, [t]);

  useEffect(() => {
    let disposed = false;
    const requestedCodec = getEncoderCodec();
    setFatalError(null);

    void isEncoderCodecSupported('direct', requestedCodec).then((supported) => {
      if (disposed) return;
      if (!window.VideoDecoder) {
        setFatalError(translationRef.current('screen.encoderUnsupported'));
        return;
      }
      if (!canvasRef.current) return;

      const codec = supported ? requestedCodec : 'h264';

      const worker = new DirectWorker();
      workerRef.current = worker;
      const offscreen = canvasRef.current.transferControlToOffscreen();
      const query = encoderCodecQuery(codec);
      const url = `${getBaseUrl('ws')}/api/stream/video/direct?${query}`;
      worker.onmessage = (
        event: MessageEvent<{
          type?: string;
          width?: number;
          height?: number;
          code?: string;
          detail?: string;
        }>
      ) => {
        const { type, width, height, code, detail } = event.data;
        if (type === 'stream-error') {
          if (detail) console.error('Direct video stream rejected:', detail);
          setFatalError(
            translationRef.current(
              code === 'unsupported-codec' ? 'screen.encoderUnsupported' : 'screen.encoderConflict'
            )
          );
          return;
        }
        if (type !== 'frame-size' || !width || !height || !canvasRef.current) return;

        canvasRef.current.dataset.mediaWidth = String(width);
        canvasRef.current.dataset.mediaHeight = String(height);
      };
      worker.postMessage({ type: 'video', codec, canvas: offscreen, url }, [offscreen]);
    });

    return () => {
      disposed = true;
      const worker = workerRef.current;
      workerRef.current = null;
      if (worker) {
        worker.postMessage({ type: 'stop' });
        worker.terminate();
      }
    };
  }, []);

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden">
      <ScreenViewport>
        <canvas
          id="screen"
          ref={canvasRef}
          className={clsx('block touch-none select-none', mouseStyle)}
        ></canvas>
      </ScreenViewport>
      {fatalError && (
        <Alert
          className="absolute left-1/2 top-6 z-50 max-w-[min(90%,560px)] -translate-x-1/2"
          type="error"
          showIcon
          message={t('screen.encoderError')}
          description={fatalError}
        />
      )}
    </div>
  );
};

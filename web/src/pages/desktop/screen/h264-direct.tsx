import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { w3cwebsocket as W3cWebSocket } from 'websocket';
import Queue from 'yocto-queue';

import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse';
import { resolutionAtom } from '@/jotai/screen.ts';

export const H264Direct = () => {
  const resolution = useAtomValue(resolutionAtom);
  const mouseStyle = useAtomValue(mouseStyleAtom);

  const canvasRef = useRef<any>();
  const renderingRef = useRef(false);
  const decoderRef = useRef<VideoDecoder | null>(null);

  const frameQueue = new Queue<VideoFrame>();

  // init websocket
  useEffect(() => {
    if (!window.VideoDecoder) {
      console.log('Error: WebCodecs API not supported.');
      return;
    }

    const url = `${getBaseUrl('ws')}/api/stream/h264/direct`;
    const ws = new W3cWebSocket(url);
    ws.binaryType = 'arraybuffer';

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string);

        if (!decoderRef.current && message.isKeyFrame) {
          initializeDecoder();
        }

        if (decoderRef.current?.state === 'configured') {
          decode(message);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = () => {
      resetDecoder();
    };
    ws.onclose = () => {
      resetDecoder();
    };

    return () => {
      if (ws.readyState === 1) {
        ws.close();
      }
      resetDecoder();
    };
  }, []);

  // init video decoder
  function initializeDecoder() {
    if (!window.VideoDecoder) {
      return;
    }
    if (decoderRef.current && decoderRef.current.state !== 'unconfigured') {
      return;
    }

    const init = {
      output: (frame: VideoFrame) => {
        frameQueue.enqueue(frame);
        if (frameQueue.size >= 10) {
          frameQueue.dequeue()?.close();
        }

        if (!renderingRef.current) {
          requestAnimationFrame(processFrameQueue);
        }
      },
      error: () => {
        resetDecoder();
      }
    };

    const config = {
      codec: 'avc1.42E01F',
      optimizeForLatency: true
    };

    try {
      const decoder = new VideoDecoder(init);
      decoder.configure(config);
      decoderRef.current = decoder;
    } catch (err) {
      console.log(err);
      decoderRef.current = null;
    }
  }

  // decode video chunk
  function decode(message: any) {
    const byteString = atob(message.data);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }

    const chunk = new EncodedVideoChunk({
      type: message.isKeyFrame ? 'key' : 'delta',
      timestamp: message.timestamp,
      data: byteArray
    });

    try {
      decoderRef.current?.decode(chunk);
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message.includes('configured')) {
        resetDecoder();
      }
    }
  }

  function processFrameQueue() {
    renderingRef.current = true;

    const frame = frameQueue.dequeue();
    if (frame) {
      renderFrame(frame);
    }

    requestAnimationFrame(processFrameQueue);
  }

  function renderFrame(frame: VideoFrame) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      frame.close();
      return;
    }

    if (canvas.width !== frame.displayWidth || canvas.height !== frame.displayHeight) {
      canvas.width = frame.displayWidth;
      canvas.height = frame.displayHeight;
    }

    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    frame.close();
  }

  // reset video decoder
  function resetDecoder() {
    if (decoderRef.current && decoderRef.current.state !== 'closed') {
      try {
        decoderRef.current.close();
      } catch (err) {
        console.log(err);
      }
    }

    decoderRef.current = null;
    renderingRef.current = false;

    Array.from(frameQueue.drain()).forEach((frame) => frame.close());
  }

  return (
    <div className="flex h-screen w-screen items-start justify-center xl:items-center">
      <canvas
        id="screen"
        ref={canvasRef}
        className={clsx('block min-h-[480px] min-w-[640px] select-none', mouseStyle)}
        style={
          resolution?.width
            ? { width: resolution.width, height: resolution.height, objectFit: 'cover' }
            : { maxWidth: '100%', maxHeight: '100%', objectFit: 'scale-down' }
        }
      ></canvas>
    </div>
  );
};

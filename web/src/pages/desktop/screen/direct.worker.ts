import Queue from 'yocto-queue';

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let rendering: boolean = false;
let flushScheduled: boolean = false;
let decoder: VideoDecoder | null = null;
let displayDecoder: VideoDecoder | null = null;
let replacementDecoder: VideoDecoder | null = null;
let resyncAtNextKeyFrame: boolean = false;

const maxQueuedFrames = 1;
const maxDecoderQueueSize = 6;
const frameQueue = new Queue<VideoFrame>();
const frameChannel = new MessageChannel();

frameChannel.port1.onmessage = () => {
  flushScheduled = false;
  processFrameQueue();
};

self.onmessage = (event: MessageEvent) => {
  const { type, data, canvas: offscreenCanvas } = event.data;

  switch (type) {
    case 'h264':
      canvas = offscreenCanvas;
      ctx = canvas!.getContext('2d') as OffscreenCanvasRenderingContext2D;
      break;
    case 'ws_message':
      handleWsMessage(data);
      break;
    case 'error':
    case 'close':
      resetDecoder();
      break;
  }
};

function handleWsMessage(message: ArrayBuffer) {
  try {
    if (message.byteLength < 9) {
      return;
    }

    const view = new DataView(message);
    const isKeyFrame = view.getUint8(0) === 1;
    const timestamp = Number(view.getBigUint64(1, true));
    const data = new Uint8Array(message, 9);

    if (
      !replacementDecoder &&
      decoder?.state === 'configured' &&
      decoder.decodeQueueSize >= maxDecoderQueueSize
    ) {
      resyncAtNextKeyFrame = true;
    }

    if (resyncAtNextKeyFrame && isKeyFrame && displayDecoder) {
      const replacement = createDecoder();
      if (replacement) {
        replacementDecoder = replacement;
        decoder = replacement;
        resyncAtNextKeyFrame = false;
      }
    }

    if (!decoder) {
      if (!isKeyFrame) {
        return;
      }
      const initial = createDecoder();
      if (!initial) {
        return;
      }
      decoder = initial;
      displayDecoder = initial;
    }

    if (decoder?.state === 'configured') {
      decode(decoder, isKeyFrame, timestamp, data);
    }
  } catch (error) {
    console.error('Error processing WebSocket message in worker:', error);
  }
}

function createDecoder(): VideoDecoder | null {
  if (!self.VideoDecoder) {
    console.log('Error: WebCodecs API not supported in this worker.');
    return null;
  }

  let instance: VideoDecoder | null = null;
  const init = {
    output: (frame: VideoFrame) => {
      handleDecodedFrame(instance, frame);
    },
    error: () => {
      resetDecoder();
    }
  };

  try {
    instance = new VideoDecoder(init);
    instance.configure({
      codec: 'avc1.42E02A',
      hardwareAcceleration: 'prefer-hardware',
      optimizeForLatency: true
    });
    return instance;
  } catch (err) {
    console.log(err);
    return null;
  }
}

function handleDecodedFrame(source: VideoDecoder | null, frame: VideoFrame) {
  if (!source) {
    frame.close();
    return;
  }

  if (source === replacementDecoder) {
    const previous = displayDecoder;
    displayDecoder = source;
    decoder = source;
    replacementDecoder = null;

    Array.from(frameQueue.drain()).forEach((queuedFrame) => queuedFrame.close());
    if (previous && previous !== source && previous.state !== 'closed') {
      previous.close();
    }
  } else if (source !== displayDecoder) {
    frame.close();
    return;
  }

  frameQueue.enqueue(frame);
  while (frameQueue.size > maxQueuedFrames) {
    frameQueue.dequeue()?.close();
  }

  if (!rendering) {
    rendering = true;
    scheduleFrameQueue();
  }
}

function decode(target: VideoDecoder, isKeyFrame: boolean, timestamp: number, data: Uint8Array) {
  const chunk = new EncodedVideoChunk({
    type: isKeyFrame ? 'key' : 'delta',
    timestamp: timestamp,
    data: data
  });

  try {
    target.decode(chunk);
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message.includes('configured')) {
      resetDecoder();
    }
  }
}

function processFrameQueue() {
  const frame = frameQueue.dequeue();
  if (frame) {
    renderFrame(frame);
  }

  if (frameQueue.size > 0) {
    scheduleFrameQueue();
  } else {
    rendering = false;
  }
}

function scheduleFrameQueue() {
  if (flushScheduled) {
    return;
  }

  flushScheduled = true;
  frameChannel.port2.postMessage(null);
}

function renderFrame(frame: VideoFrame) {
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

function resetDecoder() {
  const decoders = new Set([decoder, displayDecoder, replacementDecoder]);
  decoders.forEach((item) => {
    if (item && item.state !== 'closed') {
      try {
        item.close();
      } catch (err) {
        console.log(err);
      }
    }
  });

  decoder = null;
  displayDecoder = null;
  replacementDecoder = null;
  resyncAtNextKeyFrame = false;
  rendering = false;
  flushScheduled = false;

  Array.from(frameQueue.drain()).forEach((frame) => frame.close());
}

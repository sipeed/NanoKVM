import { InputRegion } from '@/types';

export type MediaSize = {
  width: number;
  height: number;
};

export type FrameContent = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type RenderedMediaRect = FrameContent;

const aspectRatioTolerance = 0.01;
const mediaWidthAttribute = 'data-media-width';
const mediaHeightAttribute = 'data-media-height';
const blackPixelThreshold = 32;
const darkSampleRatio = 0.75;

export const fullFrameContent = (mediaSize: MediaSize): FrameContent => ({
  left: 0,
  top: 0,
  width: mediaSize.width,
  height: mediaSize.height
});

export function getMediaSize(screen: Element): MediaSize | null {
  const dataWidth = Number(screen.getAttribute(mediaWidthAttribute));
  const dataHeight = Number(screen.getAttribute(mediaHeightAttribute));
  if (dataWidth > 0 && dataHeight > 0) {
    return { width: dataWidth, height: dataHeight };
  }

  if (screen instanceof HTMLVideoElement && screen.videoWidth > 0 && screen.videoHeight > 0) {
    return { width: screen.videoWidth, height: screen.videoHeight };
  }

  if (screen instanceof HTMLImageElement && screen.naturalWidth > 0 && screen.naturalHeight > 0) {
    return { width: screen.naturalWidth, height: screen.naturalHeight };
  }

  return null;
}

export function isMediaReady(screen: Element) {
  if (screen instanceof HTMLVideoElement) {
    return screen.readyState >= 2 && !!getMediaSize(screen);
  }

  if (screen instanceof HTMLImageElement) {
    return !!getMediaSize(screen);
  }

  if (screen instanceof HTMLCanvasElement) {
    return !!getMediaSize(screen);
  }

  return false;
}

export function detectFrameContent(screen: Element, mediaSize: MediaSize): FrameContent {
  const sampleScale = Math.min(1, 640 / mediaSize.width, 360 / mediaSize.height);
  const width = Math.max(1, Math.round(mediaSize.width * sampleScale));
  const height = Math.max(1, Math.round(mediaSize.height * sampleScale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || !drawMediaFrame(context, screen, width, height)) {
    return fullFrameContent(mediaSize);
  }

  try {
    const pixels = context.getImageData(0, 0, width, height).data;
    let top = findBorderInset(pixels, width, height, true, 'vertical');
    let bottom = findBorderInset(pixels, width, height, false, 'vertical');
    let verticalBorder = isSymmetricBorder(top, bottom, height);
    const left = findBorderInset(
      pixels,
      width,
      height,
      true,
      'horizontal',
      verticalBorder ? top : 0,
      verticalBorder ? height - bottom : height
    );
    const right = findBorderInset(
      pixels,
      width,
      height,
      false,
      'horizontal',
      verticalBorder ? top : 0,
      verticalBorder ? height - bottom : height
    );
    const horizontalBorder = isSymmetricBorder(left, right, width);
    if (horizontalBorder) {
      top = findBorderInset(pixels, width, height, true, 'vertical', left, width - right);
      bottom = findBorderInset(pixels, width, height, false, 'vertical', left, width - right);
      verticalBorder = isSymmetricBorder(top, bottom, height);
    }
    const frameLeft = horizontalBorder ? (left / width) * mediaSize.width : 0;
    const frameRight = horizontalBorder ? (right / width) * mediaSize.width : 0;
    const frameTop = verticalBorder ? (top / height) * mediaSize.height : 0;
    const frameBottom = verticalBorder ? (bottom / height) * mediaSize.height : 0;
    return {
      left: frameLeft,
      top: frameTop,
      width: mediaSize.width - frameLeft - frameRight,
      height: mediaSize.height - frameTop - frameBottom
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
  fromStart: boolean,
  axis: 'horizontal' | 'vertical',
  sampleStart = 0,
  sampleEnd = axis === 'horizontal' ? height : width
) {
  const scanSize = axis === 'horizontal' ? width : height;
  const sampleSize = Math.max(1, sampleEnd - sampleStart);
  const lines = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(
    (ratio) => sampleStart + Math.round((sampleSize - 1) * ratio)
  );
  const limit = Math.floor(scanSize * 0.45);
  let inset = 0;
  for (let offset = 0; offset < limit; offset++) {
    const darkSamples = lines.filter((line) => {
      const x = axis === 'horizontal' ? (fromStart ? offset : width - offset - 1) : line;
      const y = axis === 'horizontal' ? line : fromStart ? offset : height - offset - 1;
      const index = (y * width + x) * 4;
      return (
        pixels[index] <= blackPixelThreshold &&
        pixels[index + 1] <= blackPixelThreshold &&
        pixels[index + 2] <= blackPixelThreshold
      );
    }).length;
    const black = darkSamples / lines.length >= darkSampleRatio;
    if (!black) break;
    inset = offset + 1;
  }
  return inset;
}

function isSymmetricBorder(start: number, end: number, size: number) {
  return (
    start >= Math.max(4, Math.round(size * 0.02)) &&
    end >= Math.max(4, Math.round(size * 0.02)) &&
    Math.abs(start - end) <= Math.max(4, Math.round(size * 0.05))
  );
}

export function getRenderedMediaRect(
  elementRect: DOMRect,
  mediaSize: MediaSize
): RenderedMediaRect {
  const mediaRatio = mediaSize.width / mediaSize.height;
  const elementRatio = elementRect.width / elementRect.height;

  let width = elementRect.width;
  let height = elementRect.height;
  let offsetX = 0;
  let offsetY = 0;

  if (mediaRatio > elementRatio) {
    height = elementRect.width / mediaRatio;
    offsetY = (elementRect.height - height) / 2;
  } else {
    width = elementRect.height * mediaRatio;
    offsetX = (elementRect.width - width) / 2;
  }

  return {
    left: elementRect.left + offsetX,
    top: elementRect.top + offsetY,
    width,
    height
  };
}

export function getConfiguredFrameContent(
  region: InputRegion,
  mediaSize: MediaSize
): FrameContent | null {
  if (!isValidInputRegion(region)) {
    return null;
  }

  if (!isInputRegionCompatible(region, mediaSize)) {
    return null;
  }

  const scaleX = mediaSize.width / region.frameWidth;
  const scaleY = mediaSize.height / region.frameHeight;
  const content = {
    left: region.left * scaleX,
    top: region.top * scaleY,
    width: region.width * scaleX,
    height: region.height * scaleY
  };

  if (
    content.left < 0 ||
    content.top < 0 ||
    content.width <= 0 ||
    content.height <= 0 ||
    content.left + content.width > mediaSize.width + 0.001 ||
    content.top + content.height > mediaSize.height + 0.001
  ) {
    return null;
  }

  return content;
}

export function isInputRegionCompatible(region: InputRegion, mediaSize: MediaSize) {
  return (
    Math.abs(region.frameWidth / region.frameHeight - mediaSize.width / mediaSize.height) <=
    aspectRatioTolerance
  );
}

export function getCenteredInputRegionByAspectRatio(
  width: number,
  height: number,
  mediaSize: MediaSize
): InputRegion | null {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return null;
  }

  const targetRatio = width / height;
  const frameRatio = mediaSize.width / mediaSize.height;
  const regionWidth = Math.round(
    targetRatio < frameRatio ? mediaSize.height * targetRatio : mediaSize.width
  );
  const regionHeight = Math.round(
    targetRatio < frameRatio ? mediaSize.height : mediaSize.width / targetRatio
  );

  return {
    frameWidth: mediaSize.width,
    frameHeight: mediaSize.height,
    left: Math.floor((mediaSize.width - regionWidth) / 2),
    top: Math.floor((mediaSize.height - regionHeight) / 2),
    width: regionWidth,
    height: regionHeight
  };
}

export function isValidInputRegion(region: InputRegion | null | undefined): region is InputRegion {
  if (!region) {
    return false;
  }

  const values = [
    region.frameWidth,
    region.frameHeight,
    region.left,
    region.top,
    region.width,
    region.height
  ];
  if (!values.every((value) => Number.isInteger(value) && Number.isFinite(value))) {
    return false;
  }

  return (
    region.frameWidth > 0 &&
    region.frameHeight > 0 &&
    region.left >= 0 &&
    region.top >= 0 &&
    region.width > 0 &&
    region.height > 0 &&
    region.left + region.width <= region.frameWidth &&
    region.top + region.height <= region.frameHeight
  );
}

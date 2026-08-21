import { cloneElement, CSSProperties, ReactElement, useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';

import {
  controlRegionModeAtom,
  inputRegionAtom,
  inputRegionSelectingAtom,
  videoScaleAtom
} from '@/jotai/screen.ts';

type ViewportSize = {
  width: number;
  height: number;
};

type ScreenViewportProps = {
  children: ReactElement<{ style?: CSSProperties }>;
};

export const ScreenViewport = ({ children }: ScreenViewportProps) => {
  const inputRegion = useAtomValue(inputRegionAtom);
  const mode = useAtomValue(controlRegionModeAtom);
  const selecting = useAtomValue(inputRegionSelectingAtom);
  const videoScale = useAtomValue(videoScaleAtom);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const cropped = mode !== 'off' && !!inputRegion && !selecting;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  let viewportWidth = containerSize.width;
  let viewportHeight = containerSize.height;
  if (cropped && inputRegion && containerSize.width > 0 && containerSize.height > 0) {
    const scale = Math.min(
      containerSize.width / inputRegion.width,
      containerSize.height / inputRegion.height
    );
    viewportWidth = inputRegion.width * scale;
    viewportHeight = inputRegion.height * scale;
  }

  const mediaStyle: CSSProperties =
    cropped && inputRegion
      ? {
          ...children.props.style,
          position: 'absolute',
          left: -(inputRegion.left / inputRegion.width) * viewportWidth,
          top: -(inputRegion.top / inputRegion.height) * viewportHeight,
          width: (inputRegion.frameWidth / inputRegion.width) * viewportWidth,
          height: (inputRegion.frameHeight / inputRegion.height) * viewportHeight,
          maxWidth: 'none',
          maxHeight: 'none',
          objectFit: 'fill',
          transform: 'none'
        }
      : {
          ...children.props.style,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: 'none'
        };

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden"
    >
      <div
        id="screen-viewport"
        className="relative overflow-hidden"
        data-cropped={cropped ? 'true' : 'false'}
        style={{
          width: viewportWidth || '100%',
          height: viewportHeight || '100%',
          transform: `scale(${videoScale})`,
          transformOrigin: 'center'
        }}
      >
        {cloneElement(children, { style: mediaStyle })}
      </div>
    </div>
  );
};

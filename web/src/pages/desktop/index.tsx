import { useEffect, useState } from 'react';
import { Splitter } from 'antd';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';

import { getInputRegion, setControlRegionMode } from '@/api/vm.ts';
import { ControlRegionConfig, InputRegion } from '@/types';
import * as storage from '@/lib/localstorage.ts';
import { client } from '@/lib/websocket.ts';
import { picoclawChatOpenAtom } from '@/jotai/picoclaw.ts';
import {
  controlRegionModeAtom,
  inputRegionAtom,
  manualInputRegionAtom,
  manualRegionsAtom,
  resolutionAtom,
  selectedManualRegionAtom,
  selectedOriginalResolutionAtom,
  videoModeAtom
} from '@/jotai/screen.ts';
import { Head } from '@/components/head.tsx';

import { CaptureStatusOverlay, useCaptureStatus } from './capture-status';
import { Keyboard } from './keyboard';
import { Menu } from './menu';
import { Mouse } from './mouse';
import { H264ModeNotification, Notification } from './notification.tsx';
import { Sidebar as PicoclawSidebar } from './picoclaw';
import { ActionOverlay } from './picoclaw/action-overlay.tsx';
import { Screen } from './screen';
import { AutoRegion } from './screen/auto-region.tsx';
import {
  getMediaSize,
  isInputRegionCompatible,
  isMediaReady,
  isValidInputRegion
} from './screen/geometry.ts';
import { InputRegionOverlay } from './screen/input-region-overlay.tsx';
import { ManualRegion } from './screen/manual-region.tsx';
import { VirtualKeyboard } from './virtual-keyboard';

function getVideoMode() {
  // MJPEG is the safe default: it works without WebRTC signaling/ICE support.
  // H.264 WebRTC remains selectable from the video menu for networks where it works.
  const defaultVideoMode = 'mjpeg';

  const cookieVideoMode = storage.getVideoMode();
  if (!cookieVideoMode || (cookieVideoMode === 'direct' && !window.VideoDecoder)) {
    return defaultVideoMode;
  }

  return ['direct', 'h264', 'mjpeg'].includes(cookieVideoMode) ? cookieVideoMode : defaultVideoMode;
}

export const Desktop = () => {
  const { t } = useTranslation();
  const isBigScreen = useMediaQuery({ minWidth: 850 });
  const [activeVideoMode] = useState(getVideoMode);
  const [picoclawSidebarWidth, setPicoclawSidebarWidth] = useState(420);
  const captureStatus = useCaptureStatus(activeVideoMode);

  const [videoMode, setVideoMode] = useAtom(videoModeAtom);
  const [resolution, setResolution] = useAtom(resolutionAtom);
  const [inputRegion, setInputRegion] = useAtom(inputRegionAtom);
  const [controlRegionMode, setControlRegionModeState] = useAtom(controlRegionModeAtom);
  const setManualInputRegion = useSetAtom(manualInputRegionAtom);
  const setManualRegions = useSetAtom(manualRegionsAtom);
  const setSelectedManualRegion = useSetAtom(selectedManualRegionAtom);
  const setSelectedOriginalResolution = useSetAtom(selectedOriginalResolutionAtom);
  const isPicoclawChatOpen = useAtomValue(picoclawChatOpenAtom);

  useEffect(() => {
    client.connect();

    setVideoMode(activeVideoMode);

    const res = storage.getResolution() || { width: 0, height: 0 };
    setResolution(res);
    setInputRegion(null);
    setManualInputRegion(null);
    setManualRegions([]);
    setSelectedManualRegion('');
    setSelectedOriginalResolution('');
    setControlRegionModeState('off');

    getInputRegion()
      .then((rsp) => {
        const config = rsp.data as ControlRegionConfig | null;
        const mode = config?.mode || 'off';
        const manualRegion = isValidInputRegion(config as InputRegion)
          ? (config as InputRegion)
          : null;
        const selectedResolution = config?.selectedResolution || '';
        const regions = config?.regions || [];
        const selectedRegion = config?.selectedRegion || '';
        const selectedManualRegion = regions.find(
          (region) => `${region.width}x${region.height}` === selectedRegion
        );
        setManualInputRegion(manualRegion);
        setManualRegions(regions);
        setSelectedManualRegion(selectedRegion);
        setSelectedOriginalResolution(selectedResolution);
        setInputRegion(mode === 'manual' && selectedRegion ? selectedManualRegion || null : null);
        setControlRegionModeState(mode);
      })
      .catch(() => {
        setControlRegionModeState('off');
        setInputRegion(null);
        setManualInputRegion(null);
        setManualRegions([]);
        setSelectedManualRegion('');
        setSelectedOriginalResolution('');
      });

    return () => {
      client.close();
    };
  }, [
    activeVideoMode,
    setControlRegionModeState,
    setInputRegion,
    setManualInputRegion,
    setManualRegions,
    setResolution,
    setSelectedManualRegion,
    setSelectedOriginalResolution,
    setVideoMode
  ]);

  useEffect(() => {
    if (controlRegionMode !== 'manual' || !inputRegion) {
      return;
    }

    const screen = document.getElementById('screen');
    if (!screen) {
      return;
    }
    const target = screen;
    const region = inputRegion;

    let cleared = false;
    let validationTimer: ReturnType<typeof setTimeout> | null = null;
    function validateMediaSize() {
      if (cleared) {
        return;
      }

      if (validationTimer !== null) {
        clearTimeout(validationTimer);
      }
      validationTimer = setTimeout(() => {
        const mediaSize = getMediaSize(target, resolution);
        if (!mediaSize || !isMediaReady(target) || isInputRegionCompatible(region, mediaSize)) {
          return;
        }

        cleared = true;
        setControlRegionMode('off')
          .then((rsp) => {
            if (rsp.code === 0) {
              setControlRegionModeState('off');
              setInputRegion(null);
            }
          })
          .catch(() => undefined);
      }, 300);
    }

    validateMediaSize();
    const observer = new MutationObserver(validateMediaSize);
    observer.observe(target, {
      attributes: true,
      attributeFilter: ['data-media-width', 'data-media-height']
    });
    target.addEventListener('load', validateMediaSize);
    target.addEventListener('loadedmetadata', validateMediaSize);
    target.addEventListener('canplay', validateMediaSize);
    target.addEventListener('resize', validateMediaSize);

    return () => {
      observer.disconnect();
      if (validationTimer !== null) {
        clearTimeout(validationTimer);
      }
      target.removeEventListener('load', validateMediaSize);
      target.removeEventListener('loadedmetadata', validateMediaSize);
      target.removeEventListener('canplay', validateMediaSize);
      target.removeEventListener('resize', validateMediaSize);
    };
  }, [
    controlRegionMode,
    inputRegion,
    resolution,
    setControlRegionModeState,
    setInputRegion,
    videoMode
  ]);

  function handleSplitterResize(sizes: number[]) {
    const nextSidebarWidth = sizes[1];
    if (typeof nextSidebarWidth === 'number' && nextSidebarWidth > 0) {
      setPicoclawSidebarWidth(nextSidebarWidth);
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-neutral-950">
      <Head title={t('head.desktop')} />

      {isBigScreen && <Notification />}
      <H264ModeNotification />

      {videoMode && resolution && (
        <div className="relative flex h-full min-h-0 w-full min-w-0">
          <Menu />
          <div className="h-full min-h-0 w-full min-w-0">
            <Splitter
              className="h-full w-full"
              style={{ height: '100%', width: '100%' }}
              onResize={handleSplitterResize}
            >
              <Splitter.Panel min="45%">
                <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden bg-black">
                  <Screen />
                  <CaptureStatusOverlay status={captureStatus} />
                </div>
              </Splitter.Panel>
              <Splitter.Panel
                size={isBigScreen && isPicoclawChatOpen ? picoclawSidebarWidth : 0}
                min={isBigScreen && isPicoclawChatOpen ? 340 : 0}
                max="45%"
                resizable={isBigScreen && isPicoclawChatOpen}
              >
                {isBigScreen && isPicoclawChatOpen ? <PicoclawSidebar /> : null}
              </Splitter.Panel>
            </Splitter>
          </div>
          <ActionOverlay />
          <AutoRegion />
          <ManualRegion />
          <InputRegionOverlay />
          <Mouse />
          <Keyboard />
        </div>
      )}

      {!isBigScreen && isPicoclawChatOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-14 z-[980] overflow-hidden bg-[#0d0d0f] shadow-2xl">
          <PicoclawSidebar />
        </div>
      ) : null}

      <VirtualKeyboard />
    </div>
  );
};

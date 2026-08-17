export type MobileMenuEdge = 'left' | 'right';

export type MobileMenuPlacement = {
  edge: MobileMenuEdge;
  top: number;
};

export type ResponsiveDeviceInput = {
  width: number;
  height: number;
  hasTouch: boolean;
  coarsePointer: boolean;
  userAgent: string;
};

export type ResponsiveDeviceState = {
  isTouchLikeDevice: boolean;
  isPortraitViewport: boolean;
  isLandscapeViewport: boolean;
  isMobilePortrait: boolean;
};

const MIN_MENU_TOP = 48;
const MENU_BOTTOM_PADDING = 48;
const DEFAULT_MENU_TOP_RATIO = 0.2;

export function getResponsiveDeviceState(input: ResponsiveDeviceInput): ResponsiveDeviceState {
  const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(input.userAgent);
  const isTouchLikeDevice = input.hasTouch || input.coarsePointer || isMobileUserAgent;
  const isPortraitViewport = input.height > input.width;
  const isLandscapeViewport = input.width >= input.height;

  return {
    isTouchLikeDevice,
    isPortraitViewport,
    isLandscapeViewport,
    isMobilePortrait: isTouchLikeDevice && isPortraitViewport
  };
}

export function clampMobileMenuTop(
  top: number,
  viewportHeight: number,
  menuHeight: number
): number {
  const maxTop = Math.max(MIN_MENU_TOP, viewportHeight - menuHeight - MENU_BOTTOM_PADDING);
  return Math.max(MIN_MENU_TOP, Math.min(top, maxTop));
}

export function getInitialMobileMenuPlacement(
  savedPlacement: unknown,
  viewportHeight: number,
  menuHeight: number
): MobileMenuPlacement {
  if (!isPlacementLike(savedPlacement)) {
    return {
      edge: 'right',
      top: clampMobileMenuTop(
        Math.round(viewportHeight * DEFAULT_MENU_TOP_RATIO),
        viewportHeight,
        menuHeight
      )
    };
  }

  return {
    edge: savedPlacement.edge === 'left' ? 'left' : 'right',
    top: clampMobileMenuTop(savedPlacement.top, viewportHeight, menuHeight)
  };
}

function isPlacementLike(value: unknown): value is { edge: unknown; top: number } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const placement = value as { edge?: unknown; top?: unknown };
  return typeof placement.top === 'number' && Number.isFinite(placement.top);
}

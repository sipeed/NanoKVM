export type System = 'Windows' | 'macOS' | 'Linux' | 'Unknown';

export interface BrowserInfo {
  os: System;
  isChrome: boolean;
}

export function getOperatingSystem(): System {
  if (typeof window === 'undefined') {
    return 'Unknown';
  }

  if ('userAgentData' in navigator) {
    // @ts-expect-error check userAgentData.platform
    const platform = navigator.userAgentData?.platform?.toLowerCase();
    if (platform) {
      if (platform === 'windows') return 'Windows';
      if (platform === 'macos') return 'macOS';
      if (platform === 'linux' || platform === 'android') return 'Linux';
    }
  }

  // Fallback to User Agent
  const userAgent = navigator.userAgent;

  if (/Win/i.test(userAgent)) return 'Windows';
  if (/Mac|iPhone|iPod|iPad/i.test(userAgent)) return 'macOS';
  if (/Linux|Android/i.test(userAgent)) return 'Linux';

  return 'Unknown';
}

export function isChromeBrowser(): boolean {
  if (typeof window === 'undefined' || !window.navigator) {
    return false;
  }

  if ('userAgentData' in navigator) {
    // @ts-expect-error userAgentData.brands
    return navigator.userAgentData?.brands?.some(
      (brand: any) => brand.brand === 'Google Chrome' || brand.brand === 'Chromium'
    );
  }

  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor;

  return (
    /Chrome|Chromium/.test(userAgent) &&
    /Google Inc/.test(vendor) &&
    !/Edg/.test(userAgent) &&
    !/OPR/.test(userAgent)
  );
}

export function getBrowserInfo(): BrowserInfo {
  return {
    os: getOperatingSystem(),
    isChrome: isChromeBrowser()
  };
}

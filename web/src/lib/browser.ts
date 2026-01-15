export interface BrowserInfo {
  os: string;
  isChrome: boolean;
}

export function getOperatingSystem(): string {
  if (typeof window === 'undefined') {
    return 'Unknown';
  }

  const platformSource =
    // @ts-expect-error check userAgentData.platform
    'userAgentData' in navigator ? navigator.userAgentData.platform : navigator.platform;

  if (!platformSource) {
    return 'Unknown';
  }

  const platform = platformSource.toLowerCase();

  if (platform.startsWith('win')) return 'Windows';
  if (platform.startsWith('mac')) return 'macOS';
  if (platform.startsWith('linux')) return 'Linux';

  return platformSource;
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

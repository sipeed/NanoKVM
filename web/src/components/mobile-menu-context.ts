import { createContext, useCallback, useContext } from 'react';

export type MobileMenuItemContextValue = {
  mobilePlacement?: 'left' | 'right';
  mobilePopoverClassName?: string;
  dismissMenuKey?: number;
  onRequestMobileMenuDismiss?: () => void;
};

export const MobileMenuItemContext = createContext<MobileMenuItemContextValue>({});

export type MobileMenuNavigationEntry = {
  id: string;
  title: string;
  canLeave?: () => boolean;
  onDismiss?: () => void;
};

export type MobileMenuNavigationContextValue = {
  activePath: MobileMenuNavigationEntry[];
  layerHost: HTMLDivElement | null;
  push: (entry: MobileMenuNavigationEntry) => void;
  pop: () => void;
  close: () => void;
};

export const MobileMenuNavigationContext = createContext<MobileMenuNavigationContextValue | null>(
  null
);

export const useDismissMobileMenu = () => {
  const { onRequestMobileMenuDismiss } = useContext(MobileMenuItemContext);
  const navigation = useContext(MobileMenuNavigationContext);

  return useCallback(() => {
    if (navigation) {
      navigation.close();
      return;
    }

    onRequestMobileMenuDismiss?.();
  }, [navigation, onRequestMobileMenuDismiss]);
};

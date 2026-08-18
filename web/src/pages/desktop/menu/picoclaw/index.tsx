import { Tooltip } from 'antd';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { picoclawChatOpenAtom } from '@/jotai/picoclaw.ts';
import { Robot } from '@/components/icons/robot.tsx';
import { useDismissMobileMenu } from '@/components/mobile-menu-context.ts';

type PicoclawProps = {
  tooltipPlacement?: 'bottom' | 'left' | 'right';
};

export const Picoclaw = ({ tooltipPlacement = 'bottom' }: PicoclawProps) => {
  const { t } = useTranslation();
  const setIsChatOpen = useSetAtom(picoclawChatOpenAtom);
  const dismissMobileMenu = useDismissMobileMenu();

  return (
    <Tooltip title={t('picoclaw.title')} mouseEnterDelay={0.6} placement={tooltipPlacement}>
      <div
        className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700/80 hover:text-white"
        onClick={() => {
          dismissMobileMenu();
          setIsChatOpen((open) => !open);
        }}
      >
        <Robot size={18} />
      </div>
    </Tooltip>
  );
};

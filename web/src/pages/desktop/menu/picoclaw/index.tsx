import { Tooltip } from 'antd';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { picoclawChatOpenAtom } from '@/jotai/picoclaw.ts';
import { Robot } from '@/components/icons/robot.tsx';

export const Picoclaw = () => {
  const { t } = useTranslation();
  const setIsChatOpen = useSetAtom(picoclawChatOpenAtom);

  return (
    <Tooltip title={t('picoclaw.title')} mouseEnterDelay={0.6} placement="bottom">
      <div
        className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700/80 hover:text-white"
        onClick={() => setIsChatOpen((open) => !open)}
      >
        <Robot size={18} />
      </div>
    </Tooltip>
  );
};

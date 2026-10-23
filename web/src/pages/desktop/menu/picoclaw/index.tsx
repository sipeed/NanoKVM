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
      <button
        type="button"
        aria-label={t('picoclaw.title')}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-neutral-300 hover:bg-neutral-700/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 min-[850px]:h-[30px] min-[850px]:w-[30px]"
        onClick={() => setIsChatOpen((open) => !open)}
      >
        <Robot size={18} />
      </button>
    </Tooltip>
  );
};

import { Tooltip } from 'antd';
import { XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CollapseProps {
  toggleMenu(expanded: boolean): void;
}

export const Collapse = ({ toggleMenu }: CollapseProps) => {
  const { t } = useTranslation();

  return (
    <Tooltip title={t('menu.collapse')} placement="bottom" mouseEnterDelay={0.6}>
      <div
        className="flex size-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700/80 hover:text-white"
        onClick={() => toggleMenu(false)}
      >
        <XIcon size={18} />
      </div>
    </Tooltip>
  );
};

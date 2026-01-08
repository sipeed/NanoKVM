import { Divider } from 'antd';
import { ChevronRightIcon, GripVerticalIcon } from 'lucide-react';

interface ExpandProps {
  toggleMenu: (expanded: boolean) => void;
}

export const Expand = ({ toggleMenu }: ExpandProps) => {
  return (
    <div className="flex items-center rounded-lg bg-neutral-800/50 p-1">
      <strong>
        <div className="flex size-[26px] cursor-move select-none items-center justify-center text-neutral-500">
          <GripVerticalIcon size={18} />
        </div>
      </strong>

      <Divider type="vertical" style={{ margin: '0 4px' }} />

      <div
        className="flex size-[26px] cursor-pointer items-center justify-center rounded text-neutral-500 hover:bg-neutral-800/60 hover:text-white"
        onClick={() => toggleMenu(true)}
      >
        <ChevronRightIcon size={18} />
      </div>
    </div>
  );
};

import { Popover } from 'antd';
import { CheckIcon, SquareKanbanIcon } from 'lucide-react';

import { updateScreen } from '@/api/vm.ts';
import { setGop as setCookie } from '@/lib/localstorage';

type GopProps = {
  gop: number;
  setGop: (gop: number) => void;
};

const gopList = [
  { key: 10, label: '10' },
  { key: 30, label: '30' },
  { key: 50, label: '50' },
  { key: 100, label: '100' }
];

export const Gop = ({ gop, setGop }: GopProps) => {
  async function update(value: number) {
    if (value === gop) return;

    const rsp = await updateScreen('gop', value);
    if (rsp.code !== 0) {
      return;
    }

    setGop(value);
    setCookie(value);
  }

  const content = (
    <>
      {gopList.map((item) => (
        <div
          key={item.key}
          className="flex cursor-pointer select-none items-center rounded py-1 pl-1 pr-6 hover:bg-neutral-700/70"
          onClick={() => update(item.key)}
        >
          <div className="flex h-[14px] w-[20px] items-end text-blue-500">
            {item.key === gop && <CheckIcon size={14} />}
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </>
  );

  return (
    <Popover content={content} placement="rightTop" arrow={false} align={{ offset: [14, 0] }}>
      <div className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700/70">
        <SquareKanbanIcon size={18} />
        <span className="select-none text-sm">GOP</span>
      </div>
    </Popover>
  );
};

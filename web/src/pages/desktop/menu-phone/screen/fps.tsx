import { useRef, useState } from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, InputNumber, Popover } from 'antd';
import { CheckIcon, ScanBarcodeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { updateScreen } from '@/api/vm';
import { setFps as setCookie } from '@/lib/localstorage';

const fpsList = [
  { key: 60, label: '60Hz' },
  { key: 30, label: '30Hz' },
  { key: 24, label: '24Hz' }
];

const defaultFps = [60, 30, 24];

type FpsProps = {
  fps: number;
  setFps: (fps: number) => void;
};

export const Fps = ({ fps, setFps }: FpsProps) => {
  const { t } = useTranslation();
  const [isCustomize, setIsCustomize] = useState(false);
  const customizeRef = useRef(0);

  function showCustomize() {
    customizeRef.current = fps;
    setIsCustomize(true);
  }

  function onChange(value: any) {
    const num = Number(value);
    if (num > 0 && num <= 60) {
      customizeRef.current = num;
    }
  }

  async function update(value: number) {
    if (isCustomize && customizeRef.current === fps) {
      setIsCustomize(false);
      return;
    }

    const rsp = await updateScreen('fps', value);
    if (rsp.code !== 0) {
      return;
    }

    setFps(value);
    setCookie(value);

    isCustomize && setIsCustomize(false);
  }

  const content = (
    <>
      {fpsList.map((item) => (
        <div
          key={item.key}
          className="flex w-[140px] cursor-pointer select-none items-center space-x-1 rounded py-1.5 pl-1 hover:bg-neutral-600"
          onClick={() => update(item.key)}
        >
          <div className="flex h-[14px] w-[20px] items-end">
            {item.key === fps && <CheckIcon size={14} />}
          </div>
          <span>{item.label}</span>
        </div>
      ))}

      <div
        className="flex w-[140px] cursor-pointer select-none items-center space-x-1 rounded py-1.5 pl-1 hover:bg-neutral-600"
        onClick={showCustomize}
      >
        {defaultFps.includes(fps) ? (
          <>
            <div className="flex h-[14px] w-[20px] items-end"></div>
            <span>{t('screen.customizeFps')}</span>
          </>
        ) : (
          <>
            <div className="flex h-[14px] w-[20px] items-end">
              <CheckIcon size={14} />
            </div>
            <span>{`Customize(${fps}Hz)`}</span>
          </>
        )}
      </div>

      {isCustomize && (
        <div className="flex items-center space-x-1 py-1">
          <InputNumber<number> defaultValue={fps} min={1} max={60} onChange={onChange} />
          <Button
            size="small"
            icon={<CheckOutlined />}
            onClick={() => update(customizeRef.current)}
          />
          <Button size="small" icon={<CloseOutlined />} onClick={() => setIsCustomize(false)} />
        </div>
      )}
    </>
  );

  return (
    <Popover content={content} placement="rightTop">
      <div className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700">
        <ScanBarcodeIcon size={18} />
        <span className="select-none text-sm">{t('screen.fps')}</span>
      </div>
    </Popover>
  );
};

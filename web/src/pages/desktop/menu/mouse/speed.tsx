import { useEffect, useState } from 'react';
import { Slider } from 'antd';
import { useAtom } from 'jotai';
import { GaugeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as storage from '@/lib/localstorage.ts';
import { scrollIntervalAtom } from '@/jotai/mouse.ts';
import { MenuSubmenu } from '@/components/menu-item.tsx';

const MAX_INTERVAL = 300;

export const Speed = () => {
  const { t } = useTranslation();

  const [scrollInterval, setScrollInterval] = useAtom(scrollIntervalAtom);

  const [scrollSpeed, setScrollSpeed] = useState(100);

  useEffect(() => {
    const speed = interval2Speed(scrollInterval);
    setScrollSpeed(speed);
  }, [scrollInterval]);

  function update(speed: number): void {
    const interval = speed2Interval(speed);
    setScrollInterval(interval);
    storage.setMouseScrollInterval(interval);
  }

  function interval2Speed(interval: number) {
    if (interval === MAX_INTERVAL) {
      return 0;
    }
    return ((MAX_INTERVAL - interval) * 100) / MAX_INTERVAL;
  }

  function speed2Interval(speed: number) {
    return MAX_INTERVAL - speed * (MAX_INTERVAL / 100);
  }

  const content = (
    <div className="h-[150px] min-w-[60px] py-3">
      <Slider
        vertical
        marks={{
          0: <span>{t('mouse.slow')}</span>,
          100: <span>{t('mouse.fast')}</span>
        }}
        range={false}
        included={false}
        step={10}
        defaultValue={scrollSpeed}
        onChange={update}
      />
    </div>
  );

  return (
    <MenuSubmenu
      title={t('mouse.speed')}
      content={content}
      popoverProps={{ placement: 'rightTop', arrow: false, align: { offset: [14, 0] } }}
    >
      <div className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700/70">
        <GaugeIcon size={18} />
        <span>{t('mouse.speed')}</span>
      </div>
    </MenuSubmenu>
  );
};

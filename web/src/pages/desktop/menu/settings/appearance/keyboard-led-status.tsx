import { Switch } from 'antd';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import * as storage from '@/lib/localstorage.ts';
import { keyboardLedStatusVisibleAtom } from '@/jotai/settings.ts';

export const KeyboardLedStatusSetting = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useAtom(keyboardLedStatusVisibleAtom);

  function update(nextVisible: boolean) {
    setVisible(nextVisible);
    storage.setKeyboardLedStatusVisible(nextVisible);
  }

  return (
    <div className="mt-5 flex w-full items-center justify-between">
      <div className="flex flex-col">
        <span className="text-neutral-400">
          {t('settings.appearance.menuBar.keyboardLedStatus')}
        </span>
        <span className="text-xs text-neutral-500">
          {t('settings.appearance.menuBar.keyboardLedStatusDesc')}
        </span>
      </div>

      <Switch checked={visible} onChange={update} />
    </div>
  );
};

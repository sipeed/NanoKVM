import { useState } from 'react';
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';

import { getKeyboardLayout, setKeyboardLayout } from '@/lib/localstorage.ts';

export const KeyboardLayoutSetting = () => {
  const { t } = useTranslation();
  const [layout, setLayout] = useState(getKeyboardLayout() || 'default');

  function handleChange(value: string) {
    setLayout(value);
    setKeyboardLayout(value);
  }

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium">{t('settings.keyboard.layout')}</label>
      <Select
        value={layout}
        onChange={handleChange}
        options={[
          { value: 'default', label: 'QWERTY (Win)' },
          { value: 'mac', label: 'QWERTY (Mac)' },
          { value: 'azerty', label: 'AZERTY (Win)' }
        ]}
      />
    </div>
  );
};

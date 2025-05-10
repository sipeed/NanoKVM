import { useEffect, useState } from 'react';
import { Select } from 'antd';
import { KeyboardIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as ls from '@/lib/localstorage.ts';

export const KeyboardLayout = () => {
  const { t } = useTranslation();
  const [layout, setLayout] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedLayout = ls.getKeyboardLayout();
    if (savedLayout) {
      setLayout(savedLayout);
    }
    setIsLoading(false);
  }, []);

  const options = [
    { value: 'default', label: 'QWERTY (US)' },
    { value: 'azerty', label: 'AZERTY (FR)' },
    { value: 'mac', label: 'QWERTY (Mac)' },
    { value: 'rus', label: 'Russian' }
  ];

  function changeLayout(value: string) {
    if (layout === value) return;
    setLayout(value);
    ls.setKeyboardLayout(value);
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-1">
        <KeyboardIcon size={16} />
        <span>{t('settings.appearance.keyboardLayout', { defaultValue: 'Keyboard Layout' })}</span>
      </div>

      <Select
        value={layout}
        style={{ width: 180 }}
        options={options}
        loading={isLoading}
        onChange={changeLayout}
      />
    </div>
  );
};

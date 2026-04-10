import { useEffect } from 'react';
import { Button, Input } from 'antd';
import { useSetAtom } from 'jotai';
import { BookOpenIcon, CpuIcon, ExternalLinkIcon, KeyRoundIcon, LinkIcon, SaveIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';

type SidebarModelConfigProps = {
  apiBase: string;
  apiKey: string;
  isSaving: boolean;
  modelIdentifier: string;
  modelName?: string;
  onApiBaseChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onModelIdentifierChange: (value: string) => void;
  onSave: () => void | Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
};

export const SidebarModelConfig = ({
  apiBase,
  apiKey,
  isSaving,
  modelIdentifier,
  modelName,
  onApiBaseChange,
  onApiKeyChange,
  onModelIdentifierChange,
  onSave,
  onCancel,
  showCancel = false
}: SidebarModelConfigProps) => {
  const { t } = useTranslation();
  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);

  useEffect(() => {
    setIsKeyboardEnable(false);
    return () => {
      setIsKeyboardEnable(true);
    };
  }, [setIsKeyboardEnable]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-8 pt-10">
      {/* Title */}
      <div className="mb-1 text-sm font-semibold text-neutral-100">
        {t('picoclaw.model.requiredTitle')}
      </div>
      <div className="mb-5 text-xs leading-5 text-neutral-500">
        {t('picoclaw.model.requiredDescription')}
        {modelName && <span className="ml-1 text-neutral-400">{modelName}</span>}
      </div>

      {/* Documentation Link */}
      <a
        href="https://docs.picoclaw.io/docs/configuration/model-list/#supported-vendors-and-protocols"
        target="_blank"
        rel="noreferrer"
        className="group mb-5 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04]">
            <BookOpenIcon className="text-sky-400" size={14} />
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-300">
              {t('picoclaw.model.docsTitle', 'Configuration Guide')}
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-500">
              {t('picoclaw.model.docsDesc', 'Supported models and protocols')}
            </div>
          </div>
        </div>
        <ExternalLinkIcon size={14} className="text-neutral-500 transition-colors group-hover:text-neutral-300" />
      </a>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-neutral-500">
            {t('picoclaw.model.modelIdentifier')}
          </label>
          <Input
            prefix={<CpuIcon size={13} className="text-neutral-500" />}
            placeholder={t('picoclaw.model.modelIdentifierPlaceholder')}
            value={modelIdentifier}
            onChange={(e) => onModelIdentifierChange(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-neutral-500">
            {t('picoclaw.model.apiKey')}
          </label>
          <Input.Password
            prefix={<KeyRoundIcon size={13} className="text-neutral-500" />}
            placeholder={t('picoclaw.model.apiKeyPlaceholder')}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-neutral-500">
            {t('picoclaw.model.apiBase')}
          </label>
          <Input
            prefix={<LinkIcon size={13} className="text-neutral-500" />}
            placeholder={t('picoclaw.model.apiBasePlaceholder')}
            value={apiBase}
            onChange={(e) => onApiBaseChange(e.target.value)}
          />
        </div>
      </div>

      {/* Save */}
      <div className="mt-6 flex justify-end gap-2">
        {showCancel && <Button onClick={onCancel}>{t('picoclaw.cancel')}</Button>}
        <Button
          icon={<SaveIcon size={13} />}
          loading={isSaving}
          onClick={() => void onSave()}
          type="primary"
        >
          {t(isSaving ? 'picoclaw.model.saving' : 'picoclaw.model.save')}
        </Button>
      </div>
    </div>
  );
};

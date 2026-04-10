import { Button, Progress } from 'antd';
import { DownloadIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SidebarInstallProps = {
  installProgress?: number;
  installStage?: string;
  isInstalling: boolean;
  onInstall: () => void | Promise<void>;
};

export const SidebarInstall = ({
  installProgress,
  installStage,
  isInstalling,
  onInstall
}: SidebarInstallProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 pb-10 pt-10">
      {/* Icon */}
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
        <DownloadIcon className="text-sky-400" size={22} />
      </div>

      <div className="w-full max-w-xs text-center">
        <div className="text-sm font-semibold text-neutral-100">
          {t('picoclaw.install.requiredTitle')}
        </div>
        <div className="mt-2 text-xs leading-5 text-neutral-500">
          {isInstalling
            ? t('picoclaw.install.progressDescription')
            : t('picoclaw.install.requiredDescription')}
        </div>

        {isInstalling && (
          <div className="mt-6 text-left">
            <div className="mb-2 flex items-center justify-between text-[11px] text-neutral-500">
              <span>{t(`picoclaw.install.stages.${installStage || 'downloading'}`)}</span>
              <span>{installProgress ?? 0}%</span>
            </div>
            <Progress
              percent={installProgress || 0}
              showInfo={false}
              strokeColor="#38bdf8"
              trailColor="rgba(255,255,255,0.07)"
              status="active"
            />
          </div>
        )}

        <div className="mt-6 flex justify-center">
          {!isInstalling && (
            <Button
              icon={<DownloadIcon size={13} />}
              onClick={() => void onInstall()}
              type="primary"
            >
              {t('picoclaw.install.install')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

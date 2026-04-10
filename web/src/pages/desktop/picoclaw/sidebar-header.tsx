import { useState } from 'react';
import { Button, Dropdown, MenuProps, Modal, Select } from 'antd';
import {
  EllipsisIcon,
  HistoryIcon,
  PlayIcon,
  PowerIcon,
  SlidersHorizontalIcon,
  TrashIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LayoutSidebarRightCollapse } from '@/components/icons/layout-sidebar-right-collapse.tsx';

type SidebarHeaderProps = {
  isCheckingRuntime: boolean;
  installed?: boolean;
  modelConfigured?: boolean;
  runtimeReady?: boolean;
  isTogglingRuntime: boolean;
  agentProfile?: string;
  isSwitchingAgent?: boolean;
  isHistoryOpen?: boolean;
  onToggleRuntime: () => void | Promise<void>;
  onClose?: () => void;
  onOpenHistory?: () => void;
  onAgentProfileChange?: (profile: string) => void | Promise<void>;
  onOpenModelConfig?: () => void;
  isUninstallingRuntime?: boolean;
  onUninstallRuntime?: () => void | Promise<void>;
};

export const SidebarHeader = ({
  isCheckingRuntime,
  installed,
  modelConfigured,
  runtimeReady,
  isTogglingRuntime,
  agentProfile,
  isSwitchingAgent,
  isHistoryOpen,
  onToggleRuntime,
  onClose,
  onOpenHistory,
  onAgentProfileChange,
  onOpenModelConfig,
  isUninstallingRuntime,
  onUninstallRuntime
}: SidebarHeaderProps) => {
  const { t } = useTranslation();
  const [isUninstallModalVisible, setIsUninstallModalVisible] = useState(false);
  const isRuntimeReady = runtimeReady === true;
  const isInstalled = installed !== false;
  const isModelConfigured = modelConfigured !== false;

  const agentOptions = [
    {
      value: 'kvm',
      title: t('picoclaw.agent.kvmTitle'),
      description: t('picoclaw.agent.kvmDescription')
    },
    {
      value: 'default',
      title: t('picoclaw.agent.defaultTitle'),
      description: t('picoclaw.agent.defaultDescription')
    }
  ];

  const handleUninstallClick = () => setIsUninstallModalVisible(true);

  const handleConfirmUninstall = () => {
    setIsUninstallModalVisible(false);
    onUninstallRuntime?.();
  };

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'model-config',
      label: <span className="text-xs">{t('picoclaw.model.menuLabel')}</span>,
      icon: <SlidersHorizontalIcon size={14} className="text-neutral-400" />,
      onClick: () => onOpenModelConfig?.(),
      disabled: isUninstallingRuntime || isTogglingRuntime || !isInstalled
    },
    {
      type: 'divider'
    },
    {
      key: 'uninstall',
      danger: true,
      label: <span className="text-xs">{t('picoclaw.uninstall.menuLabel')}</span>,
      icon: <TrashIcon size={14} />,
      onClick: handleUninstallClick,
      disabled: isUninstallingRuntime || isTogglingRuntime
    }
  ];

  return (
    <>
      <div className="flex h-12 flex-shrink-0 items-center justify-between gap-3 pl-2 pr-4">
        {/* Left: Title */}
        <div className="flex min-w-0 items-center gap-1.5">
          <Button
            type="text"
            size="small"
            onClick={onClose}
            title={t('menu.collapse')}
            className="!flex !items-center !justify-center !text-neutral-400 hover:!bg-white/[0.08] hover:!text-neutral-200"
            icon={<LayoutSidebarRightCollapse size={18} />}
          />
          {/* <span className="truncate text-[13px] font-medium text-neutral-200">{t('picoclaw.title')}</span> */}
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {isCheckingRuntime ? null : isInstalled ? (
            <>
              {/* Agent Profile Selector */}
              <Select
                variant="borderless"
                size="small"
                value={agentProfile || 'kvm'}
                onChange={(value) => void onAgentProfileChange?.(value)}
                disabled={isUninstallingRuntime || isTogglingRuntime || isSwitchingAgent}
                loading={isSwitchingAgent}
                popupMatchSelectWidth={false}
                className="min-w-[120px] text-xs [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:text-neutral-300"
                options={agentOptions.map((option) => ({
                  value: option.value,
                  label: option.title
                }))}
                optionRender={(option) => {
                  const current = agentOptions.find((item) => item.value === option.value);
                  if (!current) return option.label;
                  return (
                    <div className="py-1">
                      <div className="text-xs font-medium text-neutral-200">{current.title}</div>
                      <div className="mt-0.5 text-[10px] leading-snug text-neutral-500">
                        {current.description}
                      </div>
                    </div>
                  );
                }}
              />

              {/* Start/ Stop & History Button */}
              {isRuntimeReady ? (
                <>
                  <Button
                    type="text"
                    size="small"
                    onClick={onOpenHistory}
                    title={t('picoclaw.history.title')}
                    className={[
                      '!flex !items-center !justify-center',
                      isHistoryOpen
                        ? '!bg-white/[0.08] !text-neutral-200'
                        : '!text-neutral-400 hover:!bg-white/[0.08] hover:!text-neutral-200'
                    ].join(' ')}
                    icon={<HistoryIcon size={14} />}
                  />
                  <Button
                    disabled={isTogglingRuntime}
                    loading={isTogglingRuntime}
                    onClick={() => void onToggleRuntime()}
                    title={t('picoclaw.config.stopRuntime')}
                    icon={!isTogglingRuntime ? <PowerIcon size={14} /> : undefined}
                    type="text"
                    size="small"
                    className="!flex !items-center !justify-center !text-red-400 hover:!bg-white/[0.08] hover:!text-red-500"
                  />
                </>
              ) : isModelConfigured ? (
                <Button
                  disabled={isTogglingRuntime}
                  loading={isTogglingRuntime}
                  onClick={() => void onToggleRuntime()}
                  title={t('picoclaw.config.startRuntime')}
                  icon={!isTogglingRuntime ? <PlayIcon size={14} /> : undefined}
                  type="text"
                  size="small"
                  className="!flex !items-center !justify-center !text-neutral-400 hover:!bg-white/[0.08] hover:!text-sky-400"
                />
              ) : null}

              {/* More Menu */}
              <Dropdown
                menu={{ items: moreMenuItems }}
                trigger={['click']}
                placement="bottomRight"
                disabled={isUninstallingRuntime || isTogglingRuntime}
                arrow={{ pointAtCenter: true }}
              >
                <Button
                  disabled={isUninstallingRuntime}
                  loading={isUninstallingRuntime}
                  icon={!isUninstallingRuntime ? <EllipsisIcon size={16} /> : undefined}
                  type="text"
                  size="small"
                  className="!flex !items-center !justify-center !text-neutral-400 hover:!bg-white/[0.08] hover:!text-neutral-200"
                />
              </Dropdown>
            </>
          ) : null}
        </div>
      </div>

      <Modal
        title={t('picoclaw.uninstall.confirmTitle')}
        open={isUninstallModalVisible}
        onOk={handleConfirmUninstall}
        onCancel={() => setIsUninstallModalVisible(false)}
        okText={t('picoclaw.uninstall.confirmOk')}
        cancelText={t('picoclaw.uninstall.confirmCancel')}
        okButtonProps={{ danger: true }}
        width={400}
        centered
      >
        <p className="text-sm text-neutral-400">{t('picoclaw.uninstall.confirmContent')}</p>
      </Modal>
    </>
  );
};

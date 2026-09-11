import { useState } from 'react';
import { message, Modal } from 'antd';
import { LoaderCircleIcon, RefreshCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import semver from 'semver';

import * as api from '@/api/extensions/tailscale.ts';

type Version = {
  current: string;
  latest: string;
};

export const Update = () => {
  const { t } = useTranslation();

  const [version, setVersion] = useState<Version>();
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function checkForUpdates() {
    if (isChecking || isUpdating) return;
    setIsChecking(true);

    try {
      const rsp = await api.getVersion();
      if (rsp.code !== 0 || !rsp.data) {
        message.error(rsp.msg || t('settings.update.queryFailed'));
        return;
      }

      const nextVersion = rsp.data as Version;
      setVersion(nextVersion);

      const current = semver.valid(nextVersion.current);
      const latest = semver.valid(nextVersion.latest);
      if (
        (current && latest && semver.gte(current, latest)) ||
        nextVersion.current === nextVersion.latest
      ) {
        message.success(t('settings.update.isLatest'));
        return;
      }

      setIsModalOpen(true);
    } catch {
      message.error(t('settings.update.queryFailed'));
    } finally {
      setIsChecking(false);
    }
  }

  async function update() {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const rsp = await api.update();
      if (rsp.code !== 0 || !rsp.data) {
        message.error(rsp.msg || t('settings.update.updateFailed'));
        return;
      }

      setVersion({ current: rsp.data.current, latest: rsp.data.current });
      setIsModalOpen(false);
      message.success(t('settings.update.isLatest'));
    } catch {
      message.error(t('settings.update.updateFailed'));
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="flex h-[40px] w-full cursor-pointer items-center justify-between space-x-6 rounded border-0 bg-transparent px-2 text-left text-neutral-300 hover:bg-neutral-700/70 disabled:cursor-default"
        disabled={isChecking || isUpdating}
        onClick={checkForUpdates}
      >
        <span>{t('settings.update.title')}</span>

        <span className="flex w-[35px] shrink-0 justify-center">
          {isChecking ? (
            <LoaderCircleIcon className="animate-spin" size={16} />
          ) : (
            <RefreshCwIcon size={16} />
          )}
        </span>
      </button>

      <Modal
        title={t('settings.update.title')}
        open={isModalOpen}
        onOk={update}
        onCancel={() => setIsModalOpen(false)}
        okText={t('settings.update.confirm')}
        cancelText={t('settings.update.cancel')}
        confirmLoading={isUpdating}
        cancelButtonProps={{ disabled: isUpdating }}
        closable={!isUpdating}
        maskClosable={!isUpdating}
        centered
      >
        <div className="flex flex-col space-y-2 py-4">
          {version && <span>{`${version.current} -> ${version.latest}`}</span>}
          <span className="text-neutral-500">{t('settings.update.available')}</span>
        </div>
      </Modal>
    </>
  );
};

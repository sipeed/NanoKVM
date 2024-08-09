import { useEffect, useState } from 'react';
import { Badge, Button, Modal, Spin } from 'antd';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import semver from 'semver';

import * as api from '@/api/firmware.ts';
import { getSkipUpdate, setSkipUpdate } from '@/lib/localstorage.ts';
import { isSettingsOpenAtom } from '@/jotai/settings.ts';

type UpdateProps = {
  setIsBadgeVisible: (isBadgeVisible: boolean) => void;
};

export const Update = ({ setIsBadgeVisible }: UpdateProps) => {
  const { t } = useTranslation();
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [current, setCurrent] = useState('');
  const [latest, setLatest] = useState('');
  const [isLatest, setIsLatest] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    const skip = getSkipUpdate();
    if (!skip) {
      getVersion();
    }
  }, []);

  function showModal() {
    getVersion();

    setErrMsg('');
    setIsModalOpen(true);

    setIsSettingsOpen(false);
  }

  function getVersion() {
    if (isLoading) return;
    setIsLoading(true);

    api
      .getVersion()
      .then((rsp: any) => {
        if (rsp.code !== 0) {
          setErrMsg(t('update.queryFailed'));
          return;
        }

        setCurrent(rsp.data.current);
        setLatest(rsp.data.latest);

        if (semver.gt(rsp.data.latest, rsp.data.current)) {
          setIsLatest(false);
          setIsBadgeVisible(true);
        }
      })
      .catch(() => {
        setErrMsg(t('update.queryFailed'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function confirm() {
    if (isLatest || !latest) {
      setIsModalOpen(false);
      return;
    }

    if (isUpdating) return;
    setIsUpdating(true);

    api
      .update()
      .then((rsp: any) => {
        if (rsp.code !== 0) {
          setErrMsg(t('update.updateFailed'));
          setIsUpdating(false);
          return;
        }

        setTimeout(() => {
          window.location.reload();
        }, 6000);
      })
      .catch(() => {
        setErrMsg(t('update.updateFailed'));
        setIsUpdating(false);
      });
  }

  function cancel() {
    setIsBadgeVisible(false);

    setIsLatest(true);
    setIsModalOpen(false);
    setSkipUpdate(true);
  }

  return (
    <>
      <div
        className="flex cursor-pointer select-none items-center rounded px-3 py-1.5 hover:bg-neutral-600"
        onClick={showModal}
      >
        <Badge dot={!isLatest} color="blue" offset={[5, 5]}>
          {t('update.title')}
        </Badge>
      </div>

      <Modal
        title={t('update.title')}
        open={isModalOpen}
        width={400}
        footer={null}
        closable={false}
        centered
      >
        {isUpdating ? (
          <div className="flex h-[300px] flex-col items-center justify-center space-y-5">
            <Spin spinning={isUpdating} size="large" />
            <span className="text-neutral-400">{t('update.updating')}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pb-5 pt-10">
            {isLoading ? (
              <Spin tip={t('update.loading')} />
            ) : (
              <>
                {errMsg !== '' ? (
                  <span>{errMsg}</span>
                ) : (
                  <>
                    {isLatest ? (
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-neutral-400">{current}</span>
                        <span>{t('update.isLatest')}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1">
                        <div className="flex space-x-2">
                          <span>{current}</span>
                          <span className="text-neutral-500">{'->'}</span>
                          <span>{latest}</span>
                        </div>
                        <span>{t('update.available')}</span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            <div className="mt-10 flex items-center space-x-3">
              <Button type="primary" onClick={confirm}>
                {t('update.confirm')}
              </Button>
              {!isLatest && (
                <Button type="default" onClick={cancel}>
                  {t('update.cancel')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

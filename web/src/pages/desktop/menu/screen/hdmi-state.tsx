import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { PenIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/vm.ts';
import { hdmiEnabledAtom } from '@/jotai/hdmi.ts';


export const HdmiState = () => {
  const { t } = useTranslation();
  const [hdmiMode, setHdmiMode] = useAtom(hdmiEnabledAtom);
  const [isPcie, setIsPcie] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [_, setErrMsg] = useState('');

  useEffect(() => {
    getHdmiState();
    api.getHardware().then((rsp) => {
      if (rsp.code === 0) {
        setIsPcie(rsp.data?.version === 'PCIE');
      }
    });
  }, []);

  function getHdmiState() {
    setIsLoading(true);

    api
      .getHdmiState()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }

        setHdmiMode(rsp.data.state);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function updateHDMIState() {
    if (isLoading) return;
    setIsLoading(true);

    const mode = hdmiMode === 'enabled' ? 'disabled' : 'enabled';

    api
      .setHdmiState(mode)
      .then((rsp) => {
        setIsLoading(false);
        if (rsp.code !== 0) {
          console.log(rsp.msg);
        } else {
          setHdmiMode(mode);
        }
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
      });
  }

  return (
    <>
    {isPcie ? (
      <div
        className={clsx(
          'flex h-[30px] cursor-pointer select-none items-center space-x-2 rounded px-3 hover:bg-neutral-700/70',
          'text-neutral-300'
        )}
        onClick={updateHDMIState}
      >
        <PenIcon size={18} />
        <span>{hdmiMode === 'enabled' ? t('screen.disableHdmi') : t('screen.enableHdmi')}</span>
      </div>
    ) : (
      <></>
    )}
    </>
  );
};

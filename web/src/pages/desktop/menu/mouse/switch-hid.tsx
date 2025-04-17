import { useEffect, useState } from 'react';
import { Mouse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as localstorage from '@/lib/localstorage.ts';
import { hidStateAtom } from '@/jotai/mouse';
import { useSetAtom } from 'jotai';

export const SwitchHid = () => {
    const { t } = useTranslation();
    const [isHidEnable, setIsHidEnable] = useState(false);
    const setHidStateAtom = useSetAtom(hidStateAtom);

    function updateHidState() {
        localstorage.setHidState(!isHidEnable);
        setHidStateAtom(!isHidEnable);
        setIsHidEnable(!isHidEnable);
    }

    useEffect(() => {
        const hidEnable = localstorage.getHidState();
        setIsHidEnable(hidEnable);
    }, []);

    return (
        <div
            className="flex h-[30px] cursor-pointer select-none items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700/70"
            onClick={updateHidState}
        >
            <Mouse color={isHidEnable ? 'green' : undefined} size={18} />
            <span>{isHidEnable ? t('mouse.disableHid') : t('mouse.enableHid')}</span>
        </div>
    );
};

import { useAtomValue, useSetAtom } from 'jotai';
import { hidStateAtom, mouseModeAtom } from '@/jotai/mouse.ts';
import * as localstorage from '@/lib/localstorage.ts';

import { Absolute } from './absolute.tsx';
import { Relative } from './relative.tsx';
import { useEffect } from 'react';

export const Mouse = () => {
  const mouseMode = useAtomValue(mouseModeAtom);
  const setHidStateAtom = useSetAtom(hidStateAtom);

  useEffect(() => {
    const savedHidState = localstorage.getHidState();
    setHidStateAtom(savedHidState);
  }, [setHidStateAtom]);

  return <>
    {mouseMode === 'relative' ? <Relative /> : <Absolute />}
  </>;
};

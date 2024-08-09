import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { encrypt } from '@/lib/encrypt.ts';
import { Head } from '@/components/head.tsx';

import { Login } from './login.tsx';
import { Xterm } from './xterm.tsx';

export const Terminal = () => {
  const { t } = useTranslation();
  const [token, setToken] = useState(`t=${encrypt('root')}`);

  return (
    <>
      <Head title={t('head.terminal')} />

      {token === '' ? <Login setToken={setToken} /> : <Xterm token={token} setToken={setToken} />}
    </>
  );
};

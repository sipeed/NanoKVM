import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Head } from '@/components/head.tsx';

import { Login } from './login.tsx';
import { Xterm } from './xterm.tsx';

export const Terminal = () => {
  const { t } = useTranslation();
  const [token, setToken] = useState('u=root');

  return (
    <>
      <Head title={t('head.terminal')} />

      {token === '' ? <Login setToken={setToken} /> : <Xterm token={token} setToken={setToken} />}
    </>
  );
};

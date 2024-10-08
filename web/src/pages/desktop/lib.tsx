import { useEffect } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/application.ts';

type LibProps = {
  setIsLoading: (isLoading: boolean) => void;
  setTips: (tips: string) => void;
};

export const Lib = ({ setIsLoading, setTips }: LibProps) => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    getLib();
  }, []);

  function getLib() {
    api.getLib().then((rsp) => {
      if (rsp.code !== 0) {
        showMessage(t('checkLibFailed'));
        return;
      }

      if (rsp.data.exist) {
        return;
      }

      downloadLib();
    });
  }

  function downloadLib() {
    setIsLoading(true);
    setTips(t('updatingLib'));

    api
      .updateLib()
      .then((rsp) => {
        if (rsp.code !== 0) {
          showMessage(t('updateLibFailed'));
        }
      })
      .finally(() => {
        setIsLoading(false);
        setTips('');

        setTimeout(() => {
          window.location.reload();
        }, 6000);
      });
  }

  function showMessage(content: string) {
    messageApi.open({
      type: 'warning',
      content,
      duration: 10,
      style: {
        marginTop: '8vh'
      }
    });
  }

  return <>{contextHolder}</>;
};

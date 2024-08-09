import { useEffect, useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { Button, Card, Modal, Spin } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/script';

type RunProps = {
  script: string;
  setIsRunning: (isRunning: boolean) => void;
};

export const Run = ({ script, setIsRunning }: RunProps) => {
  const { t } = useTranslation();
  const [state, setState] = useState('');
  const [log, setLog] = useState('');

  useEffect(() => {
    setState('running');

    api
      .runScript(script, 'foreground')
      .then((rsp) => {
        if (rsp.code !== 0) {
          setLog(rsp.msg);
          setState('failed');
          return;
        }

        setState('success');
        setLog(rsp.data.log);
      })
      .catch(() => {
        setLog(t('script.runFailed'));
        setState('failed');
      });
  }, []);

  return (
    <Modal
      title={script}
      width={600}
      closable={false}
      footer={null}
      style={{ top: 60 }}
      open={true}
    >
      {state === 'running' ? (
        <div className="flex h-[300px] items-center justify-center">
          <Spin indicator={<LoadingOutlined spin />} size="large" />
        </div>
      ) : (
        <Card className="h-[600px] overflow-auto whitespace-pre-line font-mono">{log}</Card>
      )}

      <div className="mt-5 flex justify-center">
        <Button type="primary" onClick={() => setIsRunning(false)}>
          {t('script.close')}
        </Button>
      </div>
    </Modal>
  );
};

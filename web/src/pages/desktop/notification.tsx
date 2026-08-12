import { useEffect, useRef } from 'react';
import { Button, notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { isPasswordUpdated } from '@/api/auth.ts';
import { getSkipModifyPassword, setSkipModifyPassword } from '@/lib/localstorage.ts';
import { client } from '@/lib/websocket.ts';

const H264_MODE_STATUS_EVENT = 'h264-mode-status';
const MIXED_H264_NOTIFICATION_KEY = 'mixed_h264_modes';

type H264ModeStatus = {
  generation: string;
  revision: number;
  mixed: boolean;
};

export const Notification = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const skip = getSkipModifyPassword();
    if (skip) return;

    isPasswordUpdated().then((rsp) => {
      if (rsp.code === 0 && !rsp.data.isUpdated) {
        api.warning({
          key: 'no_change_password',
          message: t('auth.changePassword'),
          description: t('auth.changePasswordDesc'),
          placement: 'topRight',
          btn: (
            <Button
              type="primary"
              onClick={() => {
                api.destroy();
                navigate('/auth/password');
              }}
            >
              {t('auth.ok')}
            </Button>
          ),
          duration: null,
          onClose: () => setSkipModifyPassword(true)
        });
      }
    });
  }, [api, navigate, t]);

  return <>{contextHolder}</>;
};

export const H264ModeNotification = () => {
  const { t } = useTranslation();
  const [api, contextHolder] = notification.useNotification();
  const latestStatusRef = useRef<H264ModeStatus | null>(null);

  useEffect(() => {
    return client.on(H264_MODE_STATUS_EVENT, (message) => {
      const status = parseH264ModeStatus(message.data);
      if (!status) return;

      const latestStatus = latestStatusRef.current;
      if (latestStatus && status.generation === latestStatus.generation && status.revision < latestStatus.revision) {
        return;
      }
      latestStatusRef.current = status;

      if (status.mixed) {
        api.warning({
          key: MIXED_H264_NOTIFICATION_KEY,
          message: t('screen.mixedH264.title'),
          description: t('screen.mixedH264.description'),
          placement: 'topRight',
          duration: null
        });
      } else {
        api.destroy(MIXED_H264_NOTIFICATION_KEY);
      }
    });
  }, [api, t]);

  return <>{contextHolder}</>;
};

function parseH264ModeStatus(data: unknown): H264ModeStatus | null {
  if (typeof data !== 'string') return null;

  try {
    const envelope = JSON.parse(data) as { data?: unknown };
    if (typeof envelope.data !== 'string') return null;

    const status = JSON.parse(envelope.data) as Partial<H264ModeStatus>;
    if (
      typeof status.generation !== 'string' ||
      typeof status.revision !== 'number' ||
      !Number.isSafeInteger(status.revision) ||
      status.revision < 0 ||
      typeof status.mixed !== 'boolean'
    ) {
      return null;
    }

    return { generation: status.generation, revision: status.revision, mixed: status.mixed };
  } catch {
    return null;
  }
}

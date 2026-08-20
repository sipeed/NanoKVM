import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth.ts';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/auth.ts';
import { User, UserRole } from '@/api/auth.ts';
import { encrypt } from '@/lib/encrypt.ts';

type CreateValues = {
  username: string;
  password: string;
  role: UserRole;
};

type PasswordValues = {
  password: string;
};

export const Users = () => {
  const { t } = useTranslation();
  const { account } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [createForm] = Form.useForm<CreateValues>();
  const [passwordForm] = Form.useForm<PasswordValues>();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const rsp = await api.getUsers();
      if (rsp.code !== 0) {
        throw new Error(rsp.msg);
      }

      const data = Array.isArray(rsp.data) ? rsp.data : rsp.data?.users;
      setUsers(
        (Array.isArray(data) ? data : []).map((user: User) => ({
          username: user.username,
          role: user.role === 'admin' ? 'admin' : 'user',
          enabled: user.enabled !== false,
          systemAccount: user.systemAccount === true
        }))
      );
    } catch {
      messageApi.error(t('settings.account.users.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [messageApi, t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function createUser(values: CreateValues) {
    setIsLoading(true);
    try {
      const rsp = await api.createUser(values.username, encrypt(values.password), values.role);
      if (rsp.code !== 0) throw new Error(rsp.msg);

      setIsCreateOpen(false);
      createForm.resetFields();
      messageApi.success(t('settings.account.users.created'));
      await loadUsers();
    } catch {
      messageApi.error(t('settings.account.users.saveFailed'));
      setIsLoading(false);
    }
  }

  async function updateUser(user: User, changes: Partial<Pick<User, 'role' | 'enabled'>>) {
    setIsLoading(true);
    try {
      const rsp = await api.updateUser(user.username, changes);
      if (rsp.code !== 0) throw new Error(rsp.msg);
      await loadUsers();
    } catch {
      messageApi.error(t('settings.account.users.saveFailed'));
      setIsLoading(false);
    }
  }

  async function deleteUser(username: string) {
    setIsLoading(true);
    try {
      const rsp = await api.deleteUser(username);
      if (rsp.code !== 0) throw new Error(rsp.msg);
      messageApi.success(t('settings.account.users.deleted'));
      await loadUsers();
    } catch {
      messageApi.error(t('settings.account.users.deleteFailed'));
      setIsLoading(false);
    }
  }

  async function resetPassword(values: PasswordValues) {
    if (!passwordUser) return;
    setIsLoading(true);
    try {
      const rsp = await api.resetUserPassword(passwordUser, encrypt(values.password));
      if (rsp.code !== 0) throw new Error(rsp.msg);
      setPasswordUser(null);
      passwordForm.resetFields();
      messageApi.success(t('settings.account.users.passwordUpdated'));
    } catch {
      messageApi.error(t('settings.account.users.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {contextHolder}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-base">{t('settings.account.users.title')}</div>
        <Button type="primary" onClick={() => setIsCreateOpen(true)}>
          {t('settings.account.users.create')}
        </Button>
      </div>

      <div className="flex flex-col space-y-2 opacity-100">
        {users.map((user) => {
          const isSelf = user.username === account.username;
          const isProtected = isSelf || user.systemAccount;
          return (
            <div
              key={user.username}
              className="flex flex-wrap items-center gap-2 rounded-md bg-neutral-800/60 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate">
                {user.username}
                {user.systemAccount && (
                  <span className="ml-2 text-xs text-neutral-500">
                    {t('settings.account.users.deviceOwner')}
                  </span>
                )}
              </span>
              <Select<UserRole>
                className="w-28"
                value={user.role}
                disabled={isLoading || isProtected}
                options={[
                  { value: 'admin', label: t('settings.account.roles.admin') },
                  { value: 'user', label: t('settings.account.roles.user') }
                ]}
                onChange={(role) => updateUser(user, { role })}
              />
              <Switch
                checked={user.enabled}
                disabled={isLoading || isProtected}
                checkedChildren={t('settings.account.users.enabled')}
                unCheckedChildren={t('settings.account.users.disabled')}
                onChange={(enabled) => updateUser(user, { enabled })}
              />
              <Button
                size="small"
                disabled={isLoading || isProtected}
                onClick={() => setPasswordUser(user.username)}
              >
                {t('settings.account.users.resetPassword')}
              </Button>
              <Popconfirm
                title={t('settings.account.users.deleteConfirm')}
                okText={t('settings.account.okBtn')}
                cancelText={t('settings.account.cancelBtn')}
                disabled={isProtected}
                onConfirm={() => deleteUser(user.username)}
              >
                <Button danger size="small" disabled={isLoading || isProtected}>
                  {t('settings.account.users.delete')}
                </Button>
              </Popconfirm>
            </div>
          );
        })}
      </div>

      <Modal
        title={t('settings.account.users.create')}
        open={isCreateOpen}
        footer={null}
        destroyOnHidden
        onCancel={() => setIsCreateOpen(false)}
      >
        <Form<CreateValues>
          form={createForm}
          layout="vertical"
          initialValues={{ role: 'user' }}
          onFinish={createUser}
        >
          <Form.Item
            name="username"
            label={t('auth.placeholderUsername')}
            rules={[
              { required: true, message: t('auth.noEmptyUsername') },
              { pattern: /^[A-Za-z0-9][A-Za-z0-9_.-]{0,31}$/, message: t('auth.illegalUsername') }
            ]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t('auth.placeholderPassword')}
            rules={[
              { required: true, message: t('auth.noEmptyPassword') },
              { min: 8, max: 72, message: t('auth.passwordLength') }
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="role" label={t('settings.account.role')}>
            <Select
              options={[
                { value: 'admin', label: t('settings.account.roles.admin') },
                { value: 'user', label: t('settings.account.roles.user') }
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} className="w-full">
            {t('settings.account.users.create')}
          </Button>
        </Form>
      </Modal>

      <Modal
        title={t('settings.account.users.resetPassword')}
        open={!!passwordUser}
        footer={null}
        destroyOnHidden
        onCancel={() => setPasswordUser(null)}
      >
        <Form<PasswordValues> form={passwordForm} layout="vertical" onFinish={resetPassword}>
          <Form.Item
            name="password"
            label={t('auth.placeholderPassword')}
            rules={[
              { required: true, message: t('auth.noEmptyPassword') },
              { min: 8, max: 72, message: t('auth.passwordLength') }
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} className="w-full">
            {t('auth.ok')}
          </Button>
        </Form>
      </Modal>
    </>
  );
};

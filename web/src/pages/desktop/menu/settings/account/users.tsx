import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth.ts';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Switch, Tooltip } from 'antd';
import { KeyRoundIcon, ShieldCheckIcon, Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/auth.ts';
import { Permission, PermissionDescriptor, User, UserRole } from '@/api/auth.ts';
import { encrypt } from '@/lib/encrypt.ts';
import { DEFAULT_PERMISSIONS } from '@/lib/permissions.ts';
import { PermissionEditor } from '@/components/permission-editor.tsx';

type CreateValues = {
  username: string;
  password: string;
  role: UserRole;
  permissions?: Permission[];
};

type PasswordValues = {
  password: string;
};

// AccountRefused marks a change the server turned down, which carries a reason
// the administrator can act on (an invalid role, the last administrator, ...).
class AccountRefused extends Error {}

export const Users = () => {
  const { t } = useTranslation();
  const { account } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [createForm] = Form.useForm<CreateValues>();
  const [passwordForm] = Form.useForm<PasswordValues>();
  const createRole = Form.useWatch('role', createForm);

  const [users, setUsers] = useState<User[]>([]);
  // The catalog drives the editor: its groups, its risk marks and the grants one
  // permission implies all come from the server, so the editor cannot offer a
  // grant the server does not enforce or hide one it does.
  const [catalog, setCatalog] = useState<PermissionDescriptor[] | null>(null);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<string | null>(null);
  const [permissionUser, setPermissionUser] = useState<User | null>(null);
  // The editor's selection lives in component state rather than in a Form: the
  // modal is destroyed when it closes, but an antd Form keeps the values of its
  // fields, so reopening it for the next account would show the previous
  // selection and save it onto the wrong user. The draft is seeded when the
  // editor opens, so a cancelled edit is not carried over either.
  const [permissionDraft, setPermissionDraft] = useState<Permission[]>([]);
  // A saved grant set is confirmed in place instead of a toast, and the dialog
  // stays open: saving is often one of several edits, and closing it would lose
  // the place the administrator was working in.
  const [isSaved, setIsSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopSavedTimer() {
    if (savedTimer.current !== null) {
      clearTimeout(savedTimer.current);
      savedTimer.current = null;
    }
  }

  function openPermissionEditor(user: User) {
    stopSavedTimer();
    setIsSaved(false);
    setPermissionDraft(user.permissions);
    setPermissionUser(user);
  }

  function closePermissionEditor() {
    stopSavedTimer();
    setIsSaved(false);
    setPermissionUser(null);
  }

  // Editing again makes the last save stale, so the confirmation goes away and
  // the footer reads Save before anything else is submitted.
  function updatePermissionDraft(permissions: Permission[]) {
    stopSavedTimer();
    setIsSaved(false);
    setPermissionDraft(permissions);
  }

  useEffect(() => {
    return () => {
      if (savedTimer.current !== null) {
        clearTimeout(savedTimer.current);
      }
    };
  }, []);

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
          permissions: Array.isArray(user.permissions) ? user.permissions : [],
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

  useEffect(() => {
    api
      .getPermissions()
      .then((rsp) => {
        if (rsp.code !== 0 || !Array.isArray(rsp.data?.permissions)) {
          setCatalogFailed(true);
          return;
        }
        setCatalog(rsp.data.permissions);
      })
      .catch(() => setCatalogFailed(true));
  }, []);

  // Only the server's own refusals carry a message worth repeating: a transport
  // failure would just add "Request failed with status code 500" to the toast.
  function saveFailedMessage(err: unknown, fallback: string) {
    const detail = err instanceof AccountRefused ? err.message : '';
    return detail ? `${fallback} — ${detail}` : fallback;
  }

  async function createUser(values: CreateValues) {
    setIsLoading(true);
    try {
      const permissions =
        values.role === 'user' ? (values.permissions ?? DEFAULT_PERMISSIONS) : undefined;
      const rsp = await api.createUser(
        values.username,
        encrypt(values.password),
        values.role,
        permissions
      );
      if (rsp.code !== 0) throw new AccountRefused(rsp.msg);

      setIsCreateOpen(false);
      createForm.resetFields();
      messageApi.success(t('settings.account.users.created'));
      await loadUsers();
    } catch (err) {
      messageApi.error(saveFailedMessage(err, t('settings.account.users.saveFailed')));
      setIsLoading(false);
    }
  }

  // updateUser reports whether the change was stored, so a caller that owns a
  // dialog only closes it on success.
  async function updateUser(
    user: User,
    changes: Partial<Pick<User, 'role' | 'enabled' | 'permissions'>>
  ) {
    setIsLoading(true);
    try {
      const rsp = await api.updateUser(user.username, changes);
      if (rsp.code !== 0) throw new AccountRefused(rsp.msg);
      await loadUsers();
      return true;
    } catch (err) {
      messageApi.error(saveFailedMessage(err, t('settings.account.users.saveFailed')));
      setIsLoading(false);
      return false;
    }
  }

  async function savePermissions() {
    if (!permissionUser) return;
    // Only grants this build knows can be sent; the server keeps the stored ones
    // it does not know (written by a newer release) on its own.
    const known = new Set(catalog?.map((descriptor) => descriptor.id) ?? []);
    const saved = await updateUser(permissionUser, {
      permissions: permissionDraft.filter((permission) => known.has(permission))
    });
    if (!saved) return;

    // The footer button carries the confirmation for a moment, then goes back to
    // Save. No toast: a grant edit is a small, reversible change.
    stopSavedTimer();
    setIsSaved(true);
    savedTimer.current = setTimeout(() => {
      savedTimer.current = null;
      setIsSaved(false);
    }, 2000);
  }

  async function deleteUser(username: string) {
    setIsLoading(true);
    try {
      const rsp = await api.deleteUser(username);
      if (rsp.code !== 0) throw new AccountRefused(rsp.msg);
      messageApi.success(t('settings.account.users.deleted'));
      await loadUsers();
    } catch (err) {
      messageApi.error(saveFailedMessage(err, t('settings.account.users.deleteFailed')));
      setIsLoading(false);
    }
  }

  async function resetPassword(values: PasswordValues) {
    if (!passwordUser) return;
    setIsLoading(true);
    try {
      const rsp = await api.resetUserPassword(passwordUser, encrypt(values.password));
      if (rsp.code !== 0) throw new AccountRefused(rsp.msg);
      setPasswordUser(null);
      passwordForm.resetFields();
      messageApi.success(t('settings.account.users.passwordUpdated'));
    } catch (err) {
      messageApi.error(saveFailedMessage(err, t('settings.account.users.saveFailed')));
    } finally {
      setIsLoading(false);
    }
  }

  // How much an account may do, without opening its editor.
  function describePermissions(user: User) {
    if (user.role === 'admin') return t('settings.account.permissions.adminAll');
    return t('settings.account.permissions.grantCount', { count: user.permissions.length });
  }

  const isPermissionEditorReadOnly = permissionUser?.role === 'admin';
  // An administrator holds every grant, so the read-only reference shows the
  // whole catalog. Its stored set is only what it held as a regular account and
  // says nothing about this role, so reading it back would describe the account
  // wrong and trip the empty-set warning on a freshly created administrator.
  const catalogPermissions = catalog?.map((descriptor) => descriptor.id) ?? [];

  // Administrators first: they are the accounts that can change everyone else.
  // The sort is stable, so accounts keep the order the account file lists them
  // in within each group.
  const sortedUsers = [...users].sort(
    (a, b) => Number(a.role !== 'admin') - Number(b.role !== 'admin')
  );

  return (
    <>
      {contextHolder}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-base">{t('settings.account.users.title')}</div>
        <Button type="primary" disabled={catalogFailed} onClick={() => setIsCreateOpen(true)}>
          {t('settings.account.users.create')}
        </Button>
      </div>

      <div className="flex flex-col space-y-2 opacity-100">
        {sortedUsers.map((user) => {
          const isSelf = user.username === account.username;
          const isProtected = isSelf || user.systemAccount;
          const isAdmin = user.role === 'admin';
          return (
            <div
              key={user.username}
              className={`flex flex-wrap items-center gap-2 rounded-md px-3 py-2 ${
                isAdmin ? 'bg-neutral-700/60' : 'bg-neutral-800/60'
              }`}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-baseline">
                  <span className="truncate">{user.username}</span>
                  {user.systemAccount && (
                    <span className="ml-2 shrink-0 text-xs text-neutral-500">
                      {t('settings.account.users.deviceOwner')}
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-neutral-500">
                  {describePermissions(user)}
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <Select<UserRole>
                  className="w-32"
                  value={user.role}
                  disabled={isLoading || isProtected}
                  options={[
                    { value: 'admin', label: t('settings.account.roles.admin') },
                    { value: 'user', label: t('settings.account.roles.user') }
                  ]}
                  onChange={(role) => updateUser(user, { role })}
                />
                <Tooltip title={t('settings.account.users.editPermissions')}>
                  <Button
                    size="small"
                    icon={<ShieldCheckIcon size={14} />}
                    aria-label={t('settings.account.users.editPermissions')}
                    disabled={isLoading || catalogFailed}
                    onClick={() => openPermissionEditor(user)}
                  />
                </Tooltip>
                <Switch
                  checked={user.enabled}
                  disabled={isLoading || isProtected}
                  checkedChildren={t('settings.account.users.enabled')}
                  unCheckedChildren={t('settings.account.users.disabled')}
                  onChange={(enabled) => updateUser(user, { enabled })}
                />
                <Tooltip title={t('settings.account.users.resetPassword')}>
                  <Button
                    size="small"
                    icon={<KeyRoundIcon size={14} />}
                    aria-label={t('settings.account.users.resetPassword')}
                    disabled={isLoading || isProtected}
                    onClick={() => setPasswordUser(user.username)}
                  />
                </Tooltip>
                <Popconfirm
                  title={t('settings.account.users.deleteConfirm')}
                  okText={t('settings.account.okBtn')}
                  cancelText={t('settings.account.cancelBtn')}
                  disabled={isProtected}
                  onConfirm={() => deleteUser(user.username)}
                >
                  <Tooltip title={t('settings.account.users.delete')}>
                    <Button
                      danger
                      size="small"
                      icon={<Trash2Icon size={14} />}
                      aria-label={t('settings.account.users.delete')}
                      disabled={isLoading || isProtected}
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
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
          initialValues={{ role: 'user', permissions: DEFAULT_PERMISSIONS }}
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
          {createRole === 'user' && (
            <Form.Item name="permissions" label={t('settings.account.permissions.title')}>
              <PermissionEditor catalog={catalog} catalogFailed={catalogFailed} />
            </Form.Item>
          )}
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={catalogFailed}
            className="w-full"
          >
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

      <Modal
        title={t('settings.account.permissions.editTitle')}
        open={!!permissionUser}
        destroyOnHidden
        onCancel={closePermissionEditor}
        onOk={() => void savePermissions()}
        okText={
          isSaved ? t('settings.account.permissions.saved') : t('settings.account.permissions.save')
        }
        cancelText={t('auth.cancel')}
        confirmLoading={isLoading}
        okButtonProps={{ disabled: !catalog }}
        // An administrator holds every grant, so its set is shown for reference
        // and there is nothing to save.
        footer={
          isPermissionEditorReadOnly ? (
            <Button onClick={closePermissionEditor}>
              {t('settings.account.permissions.close')}
            </Button>
          ) : undefined
        }
      >
        <PermissionEditor
          value={isPermissionEditorReadOnly ? catalogPermissions : permissionDraft}
          onChange={isPermissionEditorReadOnly ? undefined : updatePermissionDraft}
          catalog={catalog}
          catalogFailed={catalogFailed}
        />
      </Modal>
    </>
  );
};

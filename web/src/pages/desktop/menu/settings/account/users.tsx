import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth.ts';
import {
  Button,
  Checkbox,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Tooltip
} from 'antd';
import { CircleAlertIcon, KeyRoundIcon, ShieldCheckIcon, Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/auth.ts';
import { Permission, User, UserRole } from '@/api/auth.ts';
import { encrypt } from '@/lib/encrypt.ts';

type CreateValues = {
  username: string;
  password: string;
  role: UserRole;
  permissions?: Permission[];
};

type PasswordValues = {
  password: string;
};

type PermissionValues = {
  permissions: Permission[];
};

// i18next treats dots as key separators, so permission keys are mapped to
// dot-free label keys.
const PERMISSION_LABEL_KEYS: Record<Permission, string> = {
  'console.view': 'consoleView',
  'console.control': 'consoleControl',
  power: 'power',
  'media.mount': 'mediaMount',
  'media.manage': 'mediaManage',
  terminal: 'terminal',
  device: 'device',
  network: 'network',
  update: 'update',
  mcp: 'mcp',
  tailscale: 'tailscale',
  ai: 'ai'
};

const DEFAULT_USER_PERMISSIONS: Permission[] = ['console.view', 'console.control', 'power'];

// console.view is not a choice: nothing in the app renders without it, so the
// server rejects grant sets that omit it and the checkbox stays pinned.
const REQUIRED_PERMISSION: Permission = 'console.view';

// PERMISSION_NOTES warns about grants whose reach is wider than their name
// suggests. Shown as a hint next to the checkbox.
const PERMISSION_NOTES: Partial<Record<Permission, string>> = {
  mcp: 'settings.account.permissions.mcpNote',
  ai: 'settings.account.permissions.aiNote'
};

const CONSOLE_PERMISSIONS: Permission[] = [
  'console.view',
  'console.control',
  'power',
  'media.mount'
];

type PermissionCheckboxesProps = {
  value?: Permission[];
  onChange?: (permissions: Permission[]) => void;
  catalog: Permission[];
  labelOf: (permission: Permission) => string;
};

// PermissionCheckboxes renders the catalog in two labeled sections and plays
// the value/onChange protocol so antd Form.Item can drive it directly.
const PermissionCheckboxes = ({
  value = [],
  onChange,
  catalog,
  labelOf
}: PermissionCheckboxesProps) => {
  const { t } = useTranslation();

  function toggle(permission: Permission, checked: boolean) {
    if (!onChange || permission === REQUIRED_PERMISSION) return;
    onChange(checked ? [...value, permission] : value.filter((item) => item !== permission));
  }

  // The catalog is fetched separately, so hide a group with nothing to show.
  // The form still keeps grants it cannot render.
  const sections = [
    { title: t('settings.account.permissions.consoleGroup'), items: CONSOLE_PERMISSIONS },
    {
      title: t('settings.account.permissions.manageGroup'),
      items: catalog.filter((item) => !CONSOLE_PERMISSIONS.includes(item))
    }
  ].filter((section) => section.items.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="mb-1 text-xs text-neutral-500">{section.title}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {section.items.map((permission) => {
              const required = permission === REQUIRED_PERMISSION;
              const note = PERMISSION_NOTES[permission];

              return (
                <Checkbox
                  key={permission}
                  checked={required || value.includes(permission)}
                  disabled={required}
                  onChange={(e) => toggle(permission, e.target.checked)}
                >
                  <span className="inline-flex items-center gap-1">
                    {labelOf(permission)}
                    {note && (
                      <Tooltip title={t(note)}>
                        <span
                          className="inline-flex items-center text-amber-500"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <CircleAlertIcon size={12} />
                        </span>
                      </Tooltip>
                    )}
                  </span>
                </Checkbox>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// withRequiredPermission keeps the pinned grant in the payload so an account
// stored without it is repaired by the next save.
function withRequiredPermission(permissions: Permission[]): Permission[] {
  return permissions.includes(REQUIRED_PERMISSION)
    ? permissions
    : [REQUIRED_PERMISSION, ...permissions];
}

export const Users = () => {
  const { t } = useTranslation();
  const { account } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [createForm] = Form.useForm<CreateValues>();
  const [passwordForm] = Form.useForm<PasswordValues>();
  const [permissionForm] = Form.useForm<PermissionValues>();
  const createRole = Form.useWatch('role', createForm);

  const [users, setUsers] = useState<User[]>([]);
  const [catalog, setCatalog] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<string | null>(null);
  const [permissionUser, setPermissionUser] = useState<User | null>(null);

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
        if (rsp.code === 0 && Array.isArray(rsp.data?.permissions)) {
          setCatalog(rsp.data.permissions);
        }
      })
      .catch(() => {});
  }, []);

  function permissionLabel(permission: Permission) {
    return t(`settings.account.permissions.${PERMISSION_LABEL_KEYS[permission]}`);
  }

  async function createUser(values: CreateValues) {
    setIsLoading(true);
    try {
      const permissions =
        values.role === 'user'
          ? withRequiredPermission(values.permissions ?? DEFAULT_USER_PERMISSIONS)
          : undefined;
      const rsp = await api.createUser(
        values.username,
        encrypt(values.password),
        values.role,
        permissions
      );
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

  async function updateUser(
    user: User,
    changes: Partial<Pick<User, 'role' | 'enabled' | 'permissions'>>
  ) {
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

  async function savePermissions(values: PermissionValues) {
    if (!permissionUser) return;
    await updateUser(permissionUser, {
      permissions: withRequiredPermission(values.permissions ?? [])
    });
    setPermissionUser(null);
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
              className="flex items-center gap-2 rounded-md bg-neutral-800/60 px-3 py-2"
            >
              <span className="flex min-w-0 flex-1 items-baseline">
                <span className="truncate">{user.username}</span>
                {user.systemAccount && (
                  <span className="ml-2 shrink-0 text-xs text-neutral-500">
                    {t('settings.account.users.deviceOwner')}
                  </span>
                )}
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
                {/* Keep the slot occupied on admin rows so the trailing controls stay aligned */}
                <span className="inline-flex w-[32px] justify-center">
                  {user.role === 'user' && (
                    <Tooltip title={t('settings.account.users.editPermissions')}>
                      <Button
                        size="small"
                        icon={<ShieldCheckIcon size={14} />}
                        disabled={isLoading}
                        onClick={() => setPermissionUser(user)}
                      />
                    </Tooltip>
                  )}
                </span>
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
          initialValues={{ role: 'user', permissions: DEFAULT_USER_PERMISSIONS }}
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
              <PermissionCheckboxes catalog={catalog} labelOf={permissionLabel} />
            </Form.Item>
          )}
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

      <Modal
        title={t('settings.account.permissions.title')}
        open={!!permissionUser}
        footer={null}
        destroyOnHidden
        onCancel={() => setPermissionUser(null)}
      >
        <Form<PermissionValues>
          key={permissionUser?.username ?? 'permissions'}
          form={permissionForm}
          layout="vertical"
          initialValues={{ permissions: permissionUser?.permissions ?? [] }}
          onFinish={savePermissions}
        >
          <Form.Item name="permissions">
            <PermissionCheckboxes catalog={catalog} labelOf={permissionLabel} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} className="w-full">
            {t('auth.ok')}
          </Button>
        </Form>
      </Modal>
    </>
  );
};

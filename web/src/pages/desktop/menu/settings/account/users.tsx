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
import { MEDIA_PERMISSIONS, Permission, User, UserRole } from '@/api/auth.ts';
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

// The editor groups the catalog by what the grants give access to. A feature
// that spans two grants (media.mount and media.manage) stays in one group, and
// anything the server adds later lands in the last group instead of vanishing.
const CONSOLE_PERMISSIONS: Permission[] = ['console.view', 'console.control', 'power'];
// Services are the add-ons that talk to the device on their own (an API key, a
// VPN mesh, an agent), so they are kept apart from the device settings they can
// reach past.
const SERVICE_PERMISSIONS: Permission[] = ['mcp', 'tailscale', 'ai'];
const GROUPED_PERMISSIONS: Permission[] = [
  ...CONSOLE_PERMISSIONS,
  ...MEDIA_PERMISSIONS,
  ...SERVICE_PERMISSIONS
];

type PermissionCheckboxesProps = {
  value?: Permission[];
  onChange?: (permissions: Permission[]) => void;
  catalog: Permission[];
  labelOf: (permission: Permission) => string;
};

// PermissionCheckboxes renders the catalog in labeled sections and plays the
// value/onChange protocol so antd Form.Item can drive it directly.
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
  // The editor still keeps grants it cannot render.
  const sections = [
    {
      titleKey: 'consoleGroup',
      items: CONSOLE_PERMISSIONS.filter((item) => catalog.length === 0 || catalog.includes(item))
    },
    {
      titleKey: 'mediaGroup',
      items: MEDIA_PERMISSIONS.filter((item) => catalog.length === 0 || catalog.includes(item))
    },
    {
      titleKey: 'serviceGroup',
      items: SERVICE_PERMISSIONS.filter((item) => catalog.length === 0 || catalog.includes(item))
    },
    {
      titleKey: 'manageGroup',
      items: catalog.filter((item) => !GROUPED_PERMISSIONS.includes(item))
    }
  ].filter((section) => section.items.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => (
        <div key={section.titleKey}>
          <div className="mb-1 text-xs text-neutral-500">
            {t(`settings.account.permissions.${section.titleKey}`)}
          </div>
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

// AccountRefused marks a change the server turned down, which carries a reason
// the administrator can act on (a missing grant, an invalid role, ...).
class AccountRefused extends Error {}

export const Users = () => {
  const { t } = useTranslation();
  const { account } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [createForm] = Form.useForm<CreateValues>();
  const [passwordForm] = Form.useForm<PasswordValues>();
  const createRole = Form.useWatch('role', createForm);

  const [users, setUsers] = useState<User[]>([]);
  const [catalog, setCatalog] = useState<Permission[]>([]);
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

  function openPermissionEditor(user: User) {
    setPermissionDraft(user.permissions);
    setPermissionUser(user);
  }

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
        values.role === 'user'
          ? withRequiredPermission(values.permissions ?? DEFAULT_USER_PERMISSIONS)
          : undefined;
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
    const saved = await updateUser(permissionUser, {
      permissions: withRequiredPermission(permissionDraft)
    });
    if (saved) {
      setPermissionUser(null);
    }
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
                        aria-label={t('settings.account.users.editPermissions')}
                        disabled={isLoading}
                        onClick={() => openPermissionEditor(user)}
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
        title={t('settings.account.permissions.editTitle')}
        open={!!permissionUser}
        footer={null}
        destroyOnHidden
        onCancel={() => setPermissionUser(null)}
      >
        <div className="flex flex-col gap-4">
          <PermissionCheckboxes
            value={permissionDraft}
            onChange={setPermissionDraft}
            catalog={catalog}
            labelOf={permissionLabel}
          />
          <div className="flex justify-end gap-2">
            <Button disabled={isLoading} onClick={() => setPermissionUser(null)}>
              {t('auth.cancel')}
            </Button>
            <Button type="primary" loading={isLoading} onClick={() => void savePermissions()}>
              {t('settings.account.permissions.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

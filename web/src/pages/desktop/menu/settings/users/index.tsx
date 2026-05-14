import { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
  Tooltip,
  message
} from 'antd';
import { PlusIcon, Trash2Icon, KeyRoundIcon, ShieldIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/auth.ts';
import * as CryptoJS from '@/lib/encrypt.ts';

type User = {
  username: string;
  role: string;
  enabled: boolean;
};

const roleColor: Record<string, string> = {
  admin: 'red',
  operator: 'blue',
  viewer: 'default'
};

export const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [createForm] = Form.useForm();
  const [pwdForm] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    setLoading(true);
    api.listUsers().then((rsp: any) => {
      setLoading(false);
      if (rsp.code === 0) {
        setUsers(rsp.data.users || []);
      } else {
        message.error(t('settings.users.loadFailed'));
      }
    });
  }

  function handleCreate() {
    createForm.validateFields().then((values) => {
      const encPwd = CryptoJS.encrypt(values.password);
      api.createUser(values.username, encPwd, values.role).then((rsp: any) => {
        if (rsp.code === 0) {
          message.success(t('settings.users.createSuccess'));
          setCreateOpen(false);
          createForm.resetFields();
          loadUsers();
        } else {
          message.error(rsp.msg || t('settings.users.createFailed'));
        }
      });
    });
  }

  function handleDelete(username: string) {
    api.deleteUser(username).then((rsp: any) => {
      if (rsp.code === 0) {
        message.success(t('settings.users.deleteSuccess'));
        loadUsers();
      } else {
        message.error(rsp.msg || t('settings.users.deleteFailed'));
      }
    });
  }

  function handleRoleChange(username: string, role: string) {
    api.updateUser(username, { role }).then((rsp: any) => {
      if (rsp.code === 0) {
        message.success(t('settings.users.updateSuccess'));
        loadUsers();
      } else {
        message.error(rsp.msg || t('settings.users.updateFailed'));
      }
    });
  }

  function handleToggleEnabled(username: string, enabled: boolean) {
    api.updateUser(username, { enabled }).then((rsp: any) => {
      if (rsp.code === 0) {
        loadUsers();
      } else {
        message.error(rsp.msg || t('settings.users.updateFailed'));
      }
    });
  }

  function openPwdModal(username: string) {
    setSelectedUser(username);
    pwdForm.resetFields();
    setPwdOpen(true);
  }

  function handlePwdChange() {
    pwdForm.validateFields().then((values) => {
      if (values.password !== values.confirm) {
        message.error(t('settings.users.pwdMismatch'));
        return;
      }
      const encPwd = CryptoJS.encrypt(values.password);
      api.changeUserPassword(selectedUser, encPwd).then((rsp: any) => {
        if (rsp.code === 0) {
          message.success(t('settings.users.pwdSuccess'));
          setPwdOpen(false);
        } else {
          message.error(rsp.msg || t('settings.users.pwdFailed'));
        }
      });
    });
  }

  const columns = [
    {
      title: t('settings.users.colUsername'),
      dataIndex: 'username',
      key: 'username',
      render: (name: string) => <span className="font-mono">{name}</span>
    },
    {
      title: t('settings.users.colRole'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: User) => (
        <Select
          value={role}
          size="small"
          style={{ width: 110 }}
          onChange={(val) => handleRoleChange(record.username, val)}
          options={[
            { value: 'admin', label: <Tag color="red">admin</Tag> },
            { value: 'operator', label: <Tag color="blue">operator</Tag> },
            { value: 'viewer', label: <Tag>viewer</Tag> }
          ]}
        />
      )
    },
    {
      title: t('settings.users.colEnabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: User) => (
        <Switch
          size="small"
          checked={enabled}
          onChange={(val) => handleToggleEnabled(record.username, val)}
        />
      )
    },
    {
      title: t('settings.users.colActions'),
      key: 'actions',
      render: (_: any, record: User) => (
        <div className="flex items-center space-x-2">
          <Tooltip title={t('settings.users.changePassword')}>
            <Button
              size="small"
              type="text"
              icon={<KeyRoundIcon size={14} />}
              onClick={() => openPwdModal(record.username)}
            />
          </Tooltip>
          <Popconfirm
            title={t('settings.users.deleteConfirm')}
            onConfirm={() => handleDelete(record.username)}
            okText={t('settings.users.okBtn')}
            cancelText={t('settings.users.cancelBtn')}
          >
            <Tooltip title={t('settings.users.delete')}>
              <Button size="small" type="text" danger icon={<Trash2Icon size={14} />} />
            </Tooltip>
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-base">
          <ShieldIcon size={16} />
          <span>{t('settings.users.title')}</span>
        </div>
        <Button
          type="primary"
          size="small"
          icon={<PlusIcon size={14} />}
          onClick={() => setCreateOpen(true)}
        >
          {t('settings.users.addUser')}
        </Button>
      </div>

      <Divider className="opacity-50" />

      <div className="mb-4 rounded-lg border border-neutral-700/50 bg-neutral-800/30 p-3 text-xs text-neutral-400">
        <div className="mb-1 font-medium text-neutral-300">{t('settings.users.rolesTitle')}</div>
        <div className="space-y-0.5">
          <div><Tag color="red" className="mr-1">admin</Tag>{t('settings.users.roleAdmin')}</div>
          <div><Tag color="blue" className="mr-1">operator</Tag>{t('settings.users.roleOperator')}</div>
          <div><Tag className="mr-1">viewer</Tag>{t('settings.users.roleViewer')}</div>
        </div>
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="username"
        loading={loading}
        size="small"
        pagination={false}
        className="rounded-lg"
      />

      {/* Create User Modal */}
      <Modal
        title={t('settings.users.addUser')}
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        okText={t('settings.users.okBtn')}
        cancelText={t('settings.users.cancelBtn')}
      >
        <Form form={createForm} layout="vertical" className="mt-4">
          <Form.Item
            name="username"
            label={t('settings.users.colUsername')}
            rules={[{ required: true, message: t('settings.users.usernameRequired') }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t('settings.users.password')}
            rules={[{ required: true, message: t('settings.users.passwordRequired') }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="role"
            label={t('settings.users.colRole')}
            initialValue="operator"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'admin', label: 'admin – ' + t('settings.users.roleAdmin') },
                { value: 'operator', label: 'operator – ' + t('settings.users.roleOperator') },
                { value: 'viewer', label: 'viewer – ' + t('settings.users.roleViewer') }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title={`${t('settings.users.changePassword')}: ${selectedUser}`}
        open={pwdOpen}
        onOk={handlePwdChange}
        onCancel={() => setPwdOpen(false)}
        okText={t('settings.users.okBtn')}
        cancelText={t('settings.users.cancelBtn')}
      >
        <Form form={pwdForm} layout="vertical" className="mt-4">
          <Form.Item
            name="password"
            label={t('settings.users.newPassword')}
            rules={[{ required: true, message: t('settings.users.passwordRequired') }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label={t('settings.users.confirmPassword')}
            rules={[{ required: true, message: t('settings.users.passwordRequired') }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

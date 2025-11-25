import { useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Popconfirm, Space, Table } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import type { TableProps } from 'antd/es/table';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/autostart.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';

export const Autostart = () => {
  interface AutostartItem {
    name: string;
  }

  const { t } = useTranslation();

  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);

  const [isEditAutostartOpen, setIsEditAutostartOpen] = useState(false);
  const [isManageAutostartOpen, setIsManageAutostartOpen] = useState(false);
  const [isAutostartNameEditable, setIsAutostartNameEditable] = useState(true);
  const [autostartItems, setAutostartItems] = useState<AutostartItem[]>([]);
  const [autostartName, setAutostartName] = useState('');
  const [autostartContent, setAutostartContent] = useState('');

  const autostartColumns: TableProps<AutostartItem>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <>
          <Button type="text" icon={<EditOutlined />} onClick={() => editAutostart(record.name)} />

          <Popconfirm
            title={t('settings.device.autostart.deleteConfirm')}
            onConfirm={() => deleteAutostart(record.name)}
            okText={t('settings.device.autostart.yes')}
            cancelText={t('settings.device.autostart.no')}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </>
      )
    }
  ];

  useEffect(() => {
    setIsKeyboardEnable(false);
    getAutostart();

    return () => {
      setIsKeyboardEnable(true);
    };
  }, []);

  function getAutostart() {
    api.getAutostart().then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }
      setAutostartItems([]);
      if (rsp.data?.files?.length > 0) {
        rsp.data.files.forEach((item: string) => {
          setAutostartItems((prevItems) => [...prevItems, { name: item }]);
        });
      }
    });
  }

  function uploadAutostart() {
    api.uploadAutostart(autostartName, autostartContent).then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      getAutostart();
      setAutostartContent('');
      setAutostartName('');
      setIsEditAutostartOpen(false);
    });
  }

  function editAutostart(name: string) {
    api.getAutostartContent(name).then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }
      setAutostartName(name);
      setAutostartContent(rsp.data);
      setIsEditAutostartOpen(true);
      setIsAutostartNameEditable(false);
    });
  }

  function closeEditAutostart() {
    setAutostartContent('');
    setAutostartName('');
    setIsAutostartNameEditable(true);
    setIsEditAutostartOpen(false);
  }

  function deleteAutostart(name: string) {
    api.deleteAutostart(name).then((rsp) => {
      if (rsp.code !== 0) {
        console.log(rsp.msg);
        return;
      }

      getAutostart();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span>{t('settings.device.autostart.title')}</span>
          <span className="text-xs text-neutral-500">
            {t('settings.device.autostart.description')}
          </span>
        </div>
        <div>
          <Button
            type="text"
            onClick={() => {
              setIsManageAutostartOpen(true);
            }}
            icon={<SettingOutlined />}
          />
        </div>
      </div>

      <Modal
        title={t('settings.device.autostart.title')}
        open={isEditAutostartOpen}
        onOk={uploadAutostart}
        onCancel={closeEditAutostart}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            placeholder={t('settings.device.autostart.scriptName')}
            value={autostartName}
            disabled={!isAutostartNameEditable}
            onChange={(e) => setAutostartName(e.target.value)}
          />
          <TextArea
            placeholder={t('settings.device.autostart.scriptContent')}
            value={autostartContent}
            onChange={(e) => setAutostartContent(e.target.value)}
          />
        </Space>
      </Modal>

      <Modal
        open={isManageAutostartOpen}
        footer=""
        onCancel={() => setIsManageAutostartOpen(false)}
        title={t('settings.device.autostart.title')}
        >
          <div className="flex justify-end">
          <Button
            type="text"
            onClick={() => {
              setIsEditAutostartOpen(true);
            }}
            icon={<PlusOutlined />}
          >
            {t('settings.device.autostart.new')}
          </Button>
        </div>
        <Table<AutostartItem> columns={autostartColumns} dataSource={autostartItems} />
      </Modal>
    </div>
  );
};

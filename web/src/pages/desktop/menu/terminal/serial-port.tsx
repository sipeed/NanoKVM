import { ChangeEvent, useState } from 'react';
import { Button, Input, InputNumber, Modal, Radio, RadioChangeEvent } from 'antd';
import { useSetAtom } from 'jotai';
import { SquareTerminalIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';

export const SerialPort = () => {
  const { t } = useTranslation();
  const setIsKeyboardEnable = useSetAtom(isKeyboardEnableAtom);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [port, setPort] = useState('');
  const [baudrate, setBaudrate] = useState(115200);

  function openModal() {
    setIsKeyboardEnable(false);

    setIsModalOpen(true);
  }

  function closeModal() {
    setIsKeyboardEnable(true);
    setIsModalOpen(false);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setPort(e.target.value);
  }

  function handleRadioChange(e: RadioChangeEvent) {
    setPort(e.target.value);
  }

  function onInputNumberChange(value: number | null) {
    if (value === null) return;
    setBaudrate(value);
  }

  function submit() {
    if (!port || !baudrate) {
      closeModal();
      return;
    }

    setIsModalOpen(false);
    window.open(`/#terminal?port=${port}&baud=${baudrate}`, '_blank');
  }

  return (
    <>
      <div
        className="flex h-[28px] cursor-pointer select-none items-center space-x-1 rounded px-2 py-1 hover:bg-neutral-700/70"
        onClick={openModal}
      >
        <SquareTerminalIcon size={14} />
        <span>{t('terminal.serial')}</span>
      </div>

      <Modal open={isModalOpen} title={t('terminal.serial')} footer={null} onCancel={closeModal}>
        <div className="mt-10 flex items-center space-x-[20px]">
          <div className="flex w-[80px] justify-end text-neutral-400">
            {t('terminal.serialPort')}
          </div>
          <div className="w-1/2">
            <Input
              value={port}
              placeholder={t('terminal.serialPortPlaceholder')}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="mt-3 pl-[100px]">
          <Radio.Group size="large" onChange={handleRadioChange}>
            <Radio value="/dev/ttyS1">
              <code>/dev/ttyS1</code>
            </Radio>
            <Radio value="/dev/ttyS2">
              <code>/dev/ttyS2</code>
            </Radio>
          </Radio.Group>
        </div>

        <div className="mt-7 flex items-center space-x-[20px]">
          <div className="flex w-[80px] justify-end text-neutral-400">{t('terminal.baudrate')}</div>
          <InputNumber
            controls={false}
            min={1}
            defaultValue={115200}
            onChange={onInputNumberChange}
          />
        </div>

        <div className="mb-3 mt-12 flex justify-center">
          <Button type="primary" onClick={submit}>
            {t('terminal.confirm')}
          </Button>
        </div>
      </Modal>
    </>
  );
};

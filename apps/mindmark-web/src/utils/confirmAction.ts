import { Modal } from 'ant-design-vue';

export type ConfirmationTone = 'default' | 'danger' | 'success';

export interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmationTone;
  maskClosable?: boolean;
  autoFocusButton?: 'ok' | 'cancel' | null;
}

const normalizeOptions = (options: string | ConfirmationOptions): ConfirmationOptions =>
  typeof options === 'string' ? { message: options } : options;

export const requestUserConfirmation = (options: string | ConfirmationOptions) => {
  const normalized = normalizeOptions(options);

  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: normalized.title ?? '请确认本次操作',
      content: normalized.message,
      okText: normalized.confirmText ?? '确认',
      cancelText: normalized.cancelText ?? '取消',
      okType: normalized.tone === 'danger' ? 'danger' : 'primary',
      centered: true,
      maskClosable: normalized.maskClosable ?? true,
      autoFocusButton: normalized.autoFocusButton ?? 'cancel',
      class: 'mindmark-confirm-modal',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
};

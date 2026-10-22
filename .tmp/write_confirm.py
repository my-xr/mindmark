from pathlib import Path
p=Path('apps/mindmark-web/src/utils/confirmAction.ts')
p.write_text("""import { Modal } from 'ant-design-vue';

export type ConfirmationTone = 'default' | 'danger' | 'success';

export interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmationTone;
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
      maskClosable: true,
      class: 'mindmark-confirm-modal',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
};
""", encoding='utf-8', newline='\n')

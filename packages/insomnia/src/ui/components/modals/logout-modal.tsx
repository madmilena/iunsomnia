import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import { useI18n } from '~/ui/i18n';

import type { ModalHandle, ModalProps } from '../base/modal';
import { Modal } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalFooter } from '../base/modal-footer';
import { ModalHeader } from '../base/modal-header';

interface State {
  onConfirm: (clearCredentials: boolean) => Promise<void>;
  loading?: boolean;
}

export interface LogoutModalHandle {
  show: (options: State) => void;
  hide: () => void;
}

export const LogoutModal = forwardRef<LogoutModalHandle, ModalProps>((_, ref) => {
  const { t } = useI18n();
  const modalRef = useRef<ModalHandle>(null);
  const [state, setState] = useState<State>({
    onConfirm: async () => {},
    loading: false,
  });
  const [clearCredentials, setClearCredentials] = useState(true);

  useImperativeHandle(
    ref,
    () => ({
      hide: () => {
        modalRef.current?.hide();
      },
      show: ({ onConfirm }) => {
        setState({ onConfirm, loading: false });
        setClearCredentials(true);
        modalRef.current?.show();
      },
    }),
    [],
  );

  const handleConfirm = async () => {
    await state.onConfirm(clearCredentials);
    modalRef.current?.hide();
  };

  const handleCancel = () => {
    modalRef.current?.hide();
  };

  return (
    <Modal ref={modalRef}>
      <ModalHeader>{t('modals.logOut')}</ModalHeader>
      <ModalBody className="wide pad">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={clearCredentials} onChange={e => setClearCredentials(e.target.checked)} />
          {t('modals.deleteStoredCredentials')}
        </label>
        <p className="mt-2 text-sm text-gray-400">
          {t('modals.logoutClearCredentialsPrefix')}{' '}
          <b>{t('modals.cloudProviderCredentials')}</b>, <b>{t('modals.gitProviderTokens')}</b>,{' '}
          <b>{t('modals.authenticatedProxies')}</b>, {t('common.and')} <b>{t('modals.aiProviderApiKeys')}</b>{' '}
          {t('modals.logoutClearCredentialsSuffix')}
        </p>
      </ModalBody>
      <ModalFooter>
        <div className="flex items-center gap-4">
          <button type="button" className="btn" onClick={handleCancel}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={state.loading}
            style={{ color: 'var(--color-font-danger)', backgroundColor: 'var(--color-danger)' }}
            onClick={handleConfirm}
          >
            {t('modals.logOut')}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
});

LogoutModal.displayName = 'LogoutModal';

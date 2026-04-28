import React, { useEffect, useRef, useState } from 'react';
import { OverlayContainer } from 'react-aria';

import { strings } from '../../../common/strings';
import { useWorkspaceLoaderData } from '../../../routes/organization.$organizationId.project.$projectId.workspace.$workspaceId';
import { interceptAccessError } from '../../../sync/access-error';
import { Button } from '../../components/themed-button';
import { useI18n } from '../../i18n';
import { Modal, type ModalHandle, type ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalHeader } from '../base/modal-header';

interface SyncArchiveVCSLike {
  archiveProject: () => Promise<void>;
}

type Props = ModalProps & {
  vcs: SyncArchiveVCSLike;
};

interface State {
  error?: string;
  workspaceName: string;
}

export const SyncDeleteModal = ({ vcs, onHide }: Props) => {
  const { t } = useI18n();
  const modalRef = useRef<ModalHandle>(null);
  const [state, setState] = useState<State>({
    error: '',
    workspaceName: '',
  });
  const { activeWorkspace } = useWorkspaceLoaderData()!;

  useEffect(() => {
    modalRef.current?.show();
  }, []);
  const onSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await interceptAccessError({
        action: 'delete',
        callback: async () => await vcs.archiveProject(),
        resourceName: state.workspaceName,
        resourceType: strings.collection.singular.toLowerCase(),
      });
      modalRef.current?.hide();
      onHide?.();
    } catch (err) {
      setState(state => ({
        ...state,
        error: err.message,
      }));
    }
  };
  const { error, workspaceName } = state;

  return (
    <OverlayContainer>
      <Modal ref={modalRef} skinny onHide={onHide}>
        <ModalHeader>{t('modals.deleteCollection', { collectionLabel: strings.collection.singular })}</ModalHeader>
        <ModalBody className="wide pad-left pad-right text-center" noScroll>
          {error && <p className="notice error margin-bottom-sm no-margin-top">{error}</p>}
          <p className="selectable">
            {t('modals.permanentlyDeleteRemotePrefix')}{' '}
            {<strong style={{ whiteSpace: 'pre-wrap' }}>{activeWorkspace?.name}</strong>}{' '}
            {strings.collection.singular.toLowerCase()} {t('modals.permanentlyDeleteRemoteSuffix')}
          </p>
          <p className="selectable">
            {t('modals.pleaseTypeToConfirmPrefix')}{' '}
            {<strong style={{ whiteSpace: 'pre-wrap' }}>{activeWorkspace?.name}</strong>} {t('modals.pleaseTypeToConfirmSuffix')}
          </p>
          <form onSubmit={onSubmit}>
            <div className="form-control form-control--outlined">
              <input
                type="text"
                onChange={event => setState(state => ({ ...state, workspaceName: event.target.value }))}
                value={workspaceName}
              />
              <Button bg="danger" disabled={workspaceName !== activeWorkspace?.name}>
                {t('modals.deleteCollection', { collectionLabel: strings.collection.singular })}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </OverlayContainer>
  );
};

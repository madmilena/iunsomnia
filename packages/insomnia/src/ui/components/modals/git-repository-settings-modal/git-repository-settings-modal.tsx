import { useEffect, useRef } from 'react';
import { OverlayContainer } from 'react-aria';
import { useParams } from 'react-router';

import type { GitRepository } from '~/insomnia-data';
import { useGitProjectResetActionFetcher } from '~/routes/git.reset';
import { GitConnectionInfo } from '~/ui/components/git/connection-info';
import { useGitCredentials } from '~/ui/hooks/use-git-credentials';
import { useI18n } from '~/ui/i18n';

import { Modal, type ModalHandle, type ModalProps } from '../../base/modal';
import { ModalBody } from '../../base/modal-body';
import { ModalFooter } from '../../base/modal-footer';
import { ModalHeader } from '../../base/modal-header';
import { HelpTooltip } from '../../help-tooltip';

export const GitRepositorySettingsModal = ({
  gitRepository,
  ...modalProps
}: ModalProps & {
  gitRepository: GitRepository;
}) => {
  const { t } = useI18n();
  const { credentials, providers } = useGitCredentials();

  const selectedCredential = credentials.find(c => c._id === gitRepository.credentialsId);
  const selectedProvider = providers.find(p => p.type === selectedCredential?.provider);

  const { projectId, workspaceId } = useParams() as {
    projectId: string;
    workspaceId: string;
  };

  const modalRef = useRef<ModalHandle>(null);
  const resetGitRepositoryFetcher = useGitProjectResetActionFetcher();

  useEffect(() => {
    modalRef.current?.show();
  }, []);

  const authorEmail = gitRepository.selectedAuthorEmail || selectedCredential?.author.email;

  return (
    <OverlayContainer>
      <Modal ref={modalRef} {...modalProps}>
        <ModalHeader>
          {t('modals.gitRepositoryInformation')}{' '}
          <HelpTooltip>
            {t('modals.syncAndCollaborateWithGit')}
          </HelpTooltip>
        </ModalHeader>
        <ModalBody>
          {selectedProvider && (
            <GitConnectionInfo
              gitRepository={gitRepository}
              providerInfo={selectedProvider}
              authorName={selectedCredential?.author.name || selectedCredential?.author.email}
            />
          )}
          {authorEmail && (
            <div className="mt-4 flex text-[12px]">
              <div className="w-[110px] font-semibold">{t('modals.authorEmail')}</div>
              <div>{authorEmail}</div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <div
            style={{
              display: 'flex',
              gap: 'var(--padding-md)',
            }}
          >
            <button
              className="btn"
              onClick={() => {
                resetGitRepositoryFetcher.submit({
                  projectId,
                  workspaceId,
                });
              }}
            >
              {t('modals.disconnectGitRepository')}
            </button>
            <button
              type="button"
              onClick={() => modalRef.current?.hide()}
              className="btn"
              data-testid="git-repository-settings-modal__sync-btn-close"
            >
              {t('common.close')}
            </button>
          </div>
        </ModalFooter>
      </Modal>
    </OverlayContainer>
  );
};

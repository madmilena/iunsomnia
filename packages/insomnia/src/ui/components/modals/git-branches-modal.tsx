import { type FC, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  GridList,
  GridListItem,
  Heading,
  Input,
  Label,
  Modal,
  ModalOverlay,
  TextField,
} from 'react-aria-components';
import { useParams, useRevalidator } from 'react-router';

import { useGitProjectCheckoutBranchActionFetcher } from '~/routes/git.branch.checkout';
import { useGitProjectDeleteBranchActionFetcher } from '~/routes/git.branch.delete';
import { useGitProjectNewBranchActionFetcher } from '~/routes/git.branch.new';
import { useGitProjectBranchesLoaderFetcher } from '~/routes/git.branches';
import { useGitProjectChangesFetcher } from '~/routes/git.changes';
import { useI18n } from '~/ui/i18n';

import type { MergeConflict } from '../../../sync/types';
import { PromptButton } from '../base/prompt-button';
import { Icon } from '../icon';
import { AlertModal } from './alert-modal';
import { showModal } from './index';
import { SyncMergeModal } from './sync-merge-modal';

const LocalBranchItem = ({
  branch,
  isCurrent,
  projectId,
  workspaceId,
  hasUncommittedChanges,
}: {
  branch: string;
  isCurrent: boolean;
  projectId: string;
  workspaceId: string;
  hasUncommittedChanges: boolean;
}) => {
  const { t } = useI18n();
  const checkoutBranchFetcher = useGitProjectCheckoutBranchActionFetcher();
  const deleteBranchFetcher = useGitProjectDeleteBranchActionFetcher();

  useEffect(() => {
    if (
      checkoutBranchFetcher.data &&
      'errors' in checkoutBranchFetcher.data &&
      checkoutBranchFetcher.data.errors &&
      checkoutBranchFetcher.state === 'idle'
    ) {
      const error: string =
        checkoutBranchFetcher.data.errors[0] || t('modals.unexpectedCheckoutBranchError');
      showModal(AlertModal, {
        title: t('modals.errorCheckingOutBranch'),
        message: error,
      });
    }
  }, [checkoutBranchFetcher.data, checkoutBranchFetcher.state, t]);

  useEffect(() => {
    if (
      deleteBranchFetcher.data &&
      'errors' in deleteBranchFetcher.data &&
      deleteBranchFetcher.data.errors &&
      deleteBranchFetcher.state === 'idle'
    ) {
      const error: string =
        deleteBranchFetcher.data.errors[0] || t('modals.unexpectedDeleteBranchError');
      showModal(AlertModal, {
        title: t('modals.errorDeletingBranch'),
        message: error,
      });
    }
  }, [deleteBranchFetcher.data, deleteBranchFetcher.state, t]);

  const [errMsg, setErrorMessage] = useState('');

  const { revalidate } = useRevalidator();

  return (
    <div className="flex flex-col justify-start">
      <div className="flex w-full items-center">
        <span className="flex-1 truncate">
          {branch} {isCurrent ? '*' : ''}
        </span>
        <div className="flex items-center gap-2">
          {branch !== 'master' && (
            <PromptButton
              confirmMessage={t('common.confirm')}
              className="flex min-w-[12ch] items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
              doneMessage={t('modals.deleted')}
              disabled={isCurrent || branch === 'master'}
              onClick={() => {
                setErrorMessage('');
                deleteBranchFetcher.submit({
                  projectId,
                  workspaceId,
                  branch,
                });
              }}
            >
              <Icon
                icon={deleteBranchFetcher.state !== 'idle' ? 'spinner' : 'trash'}
                className={`w-5 text-(--color-danger) ${deleteBranchFetcher.state !== 'idle' ? 'animate-spin' : ''}`}
              />
              {t('common.delete')}
            </PromptButton>
          )}
          <Button
            className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
            isDisabled={isCurrent}
            onPress={() => {
              setErrorMessage('');

              checkoutBranchFetcher.submit({
                projectId,
                workspaceId,
                branch,
              });
            }}
          >
            <Icon
              icon={checkoutBranchFetcher.state !== 'idle' ? 'spinner' : 'turn-up'}
              className={`w-5 ${checkoutBranchFetcher.state !== 'idle' ? 'animate-spin' : 'rotate-90'}`}
            />
            {t('modals.checkout')}
          </Button>
          <PromptButton
            className="flex min-w-[12ch] items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
            doneMessage={t('modals.merged')}
            confirmMessage={t('common.confirm')}
            loadingMessage={t('modals.merging')}
            disabled={isCurrent}
            referToOnClickReturnValue
            onClick={async () => {
              setErrorMessage('');

              if (hasUncommittedChanges) {
                setErrorMessage(
                  t('modals.uncommittedChangesBeforeMerging'),
                );
              }
              try {
                const result = await window.main.git.mergeGitBranch({
                  projectId,
                  workspaceId,
                  theirsBranch: branch,
                  allowUncommittedChangesBeforeMerge: true,
                });

                if ('conflicts' in result) {
                  await new Promise((resolve, reject) => {
                    showModal(SyncMergeModal, {
                      conflicts: result.conflicts,
                      labels: result.labels,
                      onResolveAll: (conflicts: MergeConflict[]) => {
                        window.main.git
                          .continueMerge({
                            projectId,
                            workspaceId,
                            handledMergeConflicts: conflicts,
                            autoResolvedConflicts: result.autoResolvedConflicts,
                            commitMessage: result.commitMessage,
                            commitParent: result.commitParent,
                          })
                          .then(resolve, reject)
                          .finally(() => {
                            window.main.git.canPushLoader({ projectId, workspaceId });
                            revalidate();
                          });
                      },
                      onCancelUnresolved: () => {
                        // user aborted merge
                        reject(new Error(t('modals.mergeAbortedNoChanges')));
                      },
                    });
                  });
                }

                if ('errors' in result && result.errors && result.errors?.length > 0) {
                  setErrorMessage(result.errors.join('\n'));
                }

                revalidate();
              } catch (err) {
                const errorMessage =
                  err instanceof Error ? err.message : t('modals.unexpectedMergeBranchesError');

                setErrorMessage(errorMessage);
              }
            }}
          >
            <Icon icon={'code-merge'} className={`w-5`} />
            {t('modals.merge')}
          </PromptButton>
        </div>
      </div>
      {errMsg && <div className="text-right whitespace-break-spaces text-(--color-danger)">{errMsg}</div>}
    </div>
  );
};

const RemoteBranchItem = ({
  branch,
  projectId,
  workspaceId,
}: {
  branch: string;
  projectId: string;
  workspaceId: string;
}) => {
  const { t } = useI18n();
  const checkoutBranchFetcher = useGitProjectCheckoutBranchActionFetcher();

  useEffect(() => {
    if (
      checkoutBranchFetcher.data &&
      'errors' in checkoutBranchFetcher.data &&
      checkoutBranchFetcher.data.errors &&
      checkoutBranchFetcher.state === 'idle'
    ) {
      const error: string =
        checkoutBranchFetcher.data.errors[0] || t('modals.unexpectedPullBranchError');
      showModal(AlertModal, {
        title: t('modals.errorPullingBranch'),
        message: error,
      });
    }
  }, [checkoutBranchFetcher.data, checkoutBranchFetcher.state, t]);

  return (
    <div className="flex w-full items-center">
      <span className="flex-1 truncate">{branch}</span>
      <div className="flex items-center gap-2">
        <Button
          className="flex min-w-[12ch] items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
          onPress={() =>
            checkoutBranchFetcher.submit({
              projectId,
              workspaceId,
              branch,
            })
          }
        >
          <Icon
            icon={checkoutBranchFetcher.state !== 'idle' ? 'spinner' : 'cloud-arrow-down'}
            className={`w-5 ${checkoutBranchFetcher.state !== 'idle' ? 'animate-spin' : ''}`}
          />
          {t('modals.fetchAndCheckout')}
        </Button>
      </div>
    </div>
  );
};

interface Props {
  currentBranch: string;
  branches: string[];
  onClose: () => void;
}

function sortBranches(branchA: string, branchB: string) {
  if (branchA === 'master') {
    return -1;
  } else if (branchB === 'master') {
    return 1;
  }
  return branchA.localeCompare(branchB);
}

export const GitBranchesModal: FC<Props> = ({ currentBranch, branches, onClose }) => {
  const { t } = useI18n();
  const { organizationId, projectId, workspaceId } = useParams() as {
    organizationId: string;
    projectId: string;
    workspaceId: string;
  };

  const branchesFetcher = useGitProjectBranchesLoaderFetcher();
  const createBranchFetcher = useGitProjectNewBranchActionFetcher();

  const errors = branchesFetcher.data && 'errors' in branchesFetcher.data ? branchesFetcher.data.errors : [];
  const { remoteBranches, branches: localBranches } =
    branchesFetcher.data && 'branches' in branchesFetcher.data
      ? branchesFetcher.data
      : { branches: [], remoteBranches: [] };

  const fetchedBranches = localBranches.length > 0 ? localBranches : branches;
  const remoteOnlyBranches = remoteBranches.filter(b => !fetchedBranches.includes(b));
  const isFetchingRemoteBranches = branchesFetcher.state !== 'idle';

  useEffect(() => {
    if (branchesFetcher.state === 'idle' && !branchesFetcher.data) {
      branchesFetcher.load({
        projectId,
        workspaceId,
      });
    }
  }, [branchesFetcher, organizationId, projectId, workspaceId]);

  const createNewBranchError =
    createBranchFetcher.data?.errors && createBranchFetcher.data.errors.length > 0
      ? createBranchFetcher.data.errors[0]
      : null;

  const gitChangesFetcher = useGitProjectChangesFetcher();
  useEffect(() => {
    if (gitChangesFetcher.state === 'idle' && !gitChangesFetcher.data) {
      gitChangesFetcher.load({
        projectId,
        workspaceId,
      });
    }
  }, [projectId, workspaceId, gitChangesFetcher]);

  const hasUncommittedChanges = Boolean(
    gitChangesFetcher.data?.changes &&
      (gitChangesFetcher.data.changes.staged.length > 0 || gitChangesFetcher.data.changes.unstaged.length > 0),
  );

  return (
    <ModalOverlay
      isOpen
      onOpenChange={isOpen => {
        !isOpen && onClose();
      }}
      isDismissable
      className="fixed top-0 left-0 z-10 flex h-(--visual-viewport-height) w-full items-center justify-center bg-black/30"
    >
      <Modal
        onOpenChange={isOpen => {
          !isOpen && onClose();
        }}
        className="flex max-h-full w-full max-w-4xl flex-col rounded-md border border-solid border-(--hl-sm) bg-(--color-bg) p-(--padding-lg) text-(--color-font)"
      >
        <Dialog className="flex h-full flex-1 flex-col overflow-hidden outline-hidden">
          {({ close }) => (
            <div className="flex flex-1 flex-col gap-4 overflow-hidden">
              <div className="flex shrink-0 items-center justify-between gap-2">
                <Heading slot="title" className="text-2xl">
                  {t('modals.branches')}
                </Heading>
                <Button
                  className="flex aspect-square h-6 shrink-0 items-center justify-center rounded-xs text-sm text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
                  onPress={close}
                >
                  <Icon icon="x" />
                </Button>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();

                  const formData = new FormData(e.currentTarget);
                  const branch = formData.get('branch')?.toString().trim() || '';
                  createBranchFetcher.submit({
                    branch,
                    projectId,
                    workspaceId,
                  });
                }}
                method="POST"
                className="flex shrink-0 flex-col gap-2"
              >
                <TextField className="flex flex-col gap-2">
                  <Label className="col-span-4">{t('modals.newBranchName')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      required
                      className="col-span-3 h-8 w-full flex-1 rounded-xs border border-solid border-(--hl-sm) bg-(--color-bg) py-1 pr-7 pl-2 text-(--color-font) transition-colors placeholder:italic placeholder:opacity-60 focus:ring-1 focus:ring-(--hl-md) focus:outline-hidden"
                      type="text"
                      name="branch"
                      placeholder={t('modals.branchName')}
                    />
                    <Button
                      className="flex h-8 min-w-[12ch] items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
                      isDisabled={createBranchFetcher.state !== 'idle'}
                      type="submit"
                    >
                      <Icon
                        className={`w-5 ${createBranchFetcher.state !== 'idle' ? 'animate-spin' : ''}`}
                        icon={createBranchFetcher.state !== 'idle' ? 'spinner' : 'plus'}
                      />{' '}
                      {t('common.create')}
                    </Button>
                  </div>
                </TextField>
                {createNewBranchError && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-solid border-(--hl-md) bg-(--color-warning) p-(--padding-sm) text-(--color-font-warning)">
                    <p className="text-base">
                      <Icon icon="exclamation-triangle" className="mr-2" />
                      {createNewBranchError}
                    </p>
                  </div>
                )}
              </form>

              <div className="flex max-h-96 flex-1 flex-col divide-y divide-solid divide-(--hl-sm) overflow-hidden rounded-sm border border-solid border-(--hl-sm) select-none">
                <Heading className="p-2 text-sm font-semibold text-(--hl) uppercase">{t('modals.localBranches')}</Heading>
                <GridList
                  aria-label={t('modals.branchesList')}
                  selectionMode="none"
                  items={fetchedBranches.sort(sortBranches).map(branch => ({
                    id: branch,
                    key: branch,
                    name: branch,
                    isCurrent: branch === currentBranch,
                  }))}
                  className="flex flex-1 flex-col divide-y divide-solid divide-(--hl-sm) overflow-y-auto focus:outline-hidden data-empty:py-0"
                >
                  {item => (
                    <GridListItem
                      id={item.id}
                      key={item.key}
                      textValue={item.name}
                      className="w-full p-2 transition-colors focus:bg-(--hl-sm) focus:outline-hidden"
                    >
                      <LocalBranchItem
                        branch={item.name}
                        isCurrent={item.isCurrent}
                        projectId={projectId}
                        workspaceId={workspaceId}
                        hasUncommittedChanges={hasUncommittedChanges}
                      />
                    </GridListItem>
                  )}
                </GridList>
              </div>

              <div className="flex max-h-96 flex-1 flex-col divide-y divide-solid divide-(--hl-sm) overflow-hidden rounded-sm border border-solid border-(--hl-sm) select-none">
                <Heading className="p-2 text-sm font-semibold text-(--hl) uppercase">{t('modals.remoteBranches')}</Heading>
                <GridList
                  aria-label={t('modals.remoteBranchesList')}
                  selectionMode="none"
                  items={remoteOnlyBranches.sort(sortBranches).map(branch => ({
                    id: branch,
                    key: branch,
                    name: branch,
                    isCurrent: branch === currentBranch,
                  }))}
                  renderEmptyState={() => (
                    <div className="p-2 text-center text-(--color-font-disabled)">
                      {isFetchingRemoteBranches ? t('modals.fetchingRemoteBranches') : t('modals.noRemoteBranchesFound')}
                    </div>
                  )}
                  className="flex flex-1 flex-col divide-y divide-solid divide-(--hl-sm) overflow-y-auto focus:outline-hidden data-empty:py-0"
                >
                  {item => (
                    <GridListItem
                      id={item.id}
                      key={item.key}
                      textValue={item.name}
                      className="w-full p-2 transition-colors focus:bg-(--hl-sm) focus:outline-hidden"
                    >
                      <RemoteBranchItem branch={item.name} projectId={projectId} workspaceId={workspaceId} />
                    </GridListItem>
                  )}
                </GridList>
                {errors.length > 0 && (
                  <div className="p-2">
                    {errors.map(error => (
                      <div key={error} className="p-2">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

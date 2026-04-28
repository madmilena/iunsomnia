import React, { useEffect } from 'react';
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
import { href, useParams } from 'react-router';

import { useIusomniaSyncBranchCheckoutActionFetcher } from '~/routes/organization.$organizationId.project.$projectId.workspace.$workspaceId.insomnia-sync.branch.checkout';
import { useIusomniaSyncBranchCreateActionFetcher } from '~/routes/organization.$organizationId.project.$projectId.workspace.$workspaceId.insomnia-sync.branch.create';
import { useIusomniaSyncBranchDeleteActionFetcher } from '~/routes/organization.$organizationId.project.$projectId.workspace.$workspaceId.insomnia-sync.branch.delete';
import { useIusomniaSyncBranchMergeActionFetcher } from '~/routes/organization.$organizationId.project.$projectId.workspace.$workspaceId.insomnia-sync.branch.merge';
import { useIusomniaSyncFetchActionFetcher } from '~/routes/organization.$organizationId.project.$projectId.workspace.$workspaceId.insomnia-sync.fetch';
import { useI18n } from '~/ui/i18n';

import { PromptButton } from '../base/prompt-button';
import { Icon } from '../icon';
import { showModal } from '.';
import { AlertModal } from './alert-modal';

const LocalBranchItem = ({
  branch,
  isCurrent,
  organizationId,
  projectId,
  workspaceId,
}: {
  branch: string;
  isCurrent: boolean;
  organizationId: string;
  projectId: string;
  workspaceId: string;
}) => {
  const { t } = useI18n();
  const checkoutBranchFetcher = useIusomniaSyncBranchCheckoutActionFetcher();
  const mergeBranchFetcher = useIusomniaSyncBranchMergeActionFetcher();
  const deleteBranchFetcher = useIusomniaSyncBranchDeleteActionFetcher();

  useEffect(() => {
    if (
      checkoutBranchFetcher.data &&
      'error' in checkoutBranchFetcher.data &&
      checkoutBranchFetcher.data.error &&
      checkoutBranchFetcher.state === 'idle'
    ) {
      const error: string =
        checkoutBranchFetcher.data.error || t('modals.unexpectedCheckoutBranchError');
      showModal(AlertModal, {
        title: t('modals.errorCheckingOutBranch'),
        message: error,
      });
    }
  }, [checkoutBranchFetcher.data, checkoutBranchFetcher.state, t]);

  useEffect(() => {
    if (
      mergeBranchFetcher.data &&
      'error' in mergeBranchFetcher.data &&
      mergeBranchFetcher.data.error &&
      mergeBranchFetcher.state === 'idle'
    ) {
      const error: string = mergeBranchFetcher.data.error || t('modals.unexpectedMergeBranchesError');
      showModal(AlertModal, {
        title: t('modals.errorMergingBranches'),
        message: error,
      });
    }
  }, [mergeBranchFetcher.data, mergeBranchFetcher.state, t]);

  useEffect(() => {
    if (
      deleteBranchFetcher.data &&
      'error' in deleteBranchFetcher.data &&
      deleteBranchFetcher.data.error &&
      deleteBranchFetcher.state === 'idle'
    ) {
      const error: string = deleteBranchFetcher.data.error || t('modals.unexpectedDeleteBranchError');
      showModal(AlertModal, {
        title: t('modals.errorDeletingBranch'),
        message: error,
      });
    }
  }, [deleteBranchFetcher.data, deleteBranchFetcher.state, t]);

  return (
    <div className="flex w-full items-center">
      <span className="flex-1 truncate">{branch}</span>
      <div className="flex items-center gap-2">
        {branch !== 'master' && (
          <PromptButton
            confirmMessage={t('common.confirm')}
            className="flex min-w-[12ch] items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
            doneMessage={t('modals.deleted')}
            disabled={isCurrent || branch === 'master'}
            onClick={() =>
              deleteBranchFetcher.submit({
                organizationId,
                projectId,
                workspaceId,
                branch,
              })
            }
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
          onPress={() =>
            checkoutBranchFetcher.submit({
              organizationId,
              projectId,
              workspaceId,
              branch,
            })
          }
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
          disabled={isCurrent}
          onClick={() => {
            mergeBranchFetcher.submit({
              organizationId,
              projectId,
              workspaceId,
              branch,
            });
          }}
        >
          <Icon
            icon={mergeBranchFetcher.state !== 'idle' ? 'spinner' : 'code-merge'}
            className={`w-5 ${mergeBranchFetcher.state !== 'idle' ? 'animate-spin' : ''}`}
          />
          {t('modals.merge')}
        </PromptButton>
      </div>
    </div>
  );
};

const RemoteBranchItem = ({
  branch,
  isCurrent,
  organizationId,
  projectId,
  workspaceId,
}: {
  branch: string;
  isCurrent: boolean;
  organizationId: string;
  projectId: string;
  workspaceId: string;
}) => {
  const { t } = useI18n();
  const deleteBranchFetcher = useIusomniaSyncBranchDeleteActionFetcher();
  const pullBranchFetcher = useIusomniaSyncFetchActionFetcher();

  useEffect(() => {
    if (
      pullBranchFetcher.data &&
      'error' in pullBranchFetcher.data &&
      pullBranchFetcher.data.error &&
      pullBranchFetcher.state === 'idle'
    ) {
      const error: string = pullBranchFetcher.data.error || t('modals.unexpectedPullBranchError');
      showModal(AlertModal, {
        title: t('modals.errorPullingBranch'),
        message: error,
      });
    }
  }, [pullBranchFetcher.data, pullBranchFetcher.state, t]);

  useEffect(() => {
    if (
      deleteBranchFetcher.data &&
      'error' in deleteBranchFetcher.data &&
      deleteBranchFetcher.data.error &&
      deleteBranchFetcher.state === 'idle'
    ) {
      const error: string = deleteBranchFetcher.data.error || t('modals.unexpectedDeleteBranchError');
      showModal(AlertModal, {
        title: t('modals.errorDeletingBranch'),
        message: error,
      });
    }
  }, [deleteBranchFetcher.data, deleteBranchFetcher.state, t]);

  return (
    <div className="flex w-full items-center">
      <span className="flex-1 truncate">{branch}</span>
      <div className="flex items-center gap-2">
        {branch !== 'master' && (
          <PromptButton
            confirmMessage={t('common.confirm')}
            className="flex min-w-[12ch] items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
            doneMessage={t('modals.deleted')}
            disabled={isCurrent || branch === 'master'}
            onClick={() =>
              deleteBranchFetcher.submit({
                organizationId,
                projectId,
                workspaceId,
                branch,
              })
            }
          >
            <Icon
              icon={deleteBranchFetcher.state !== 'idle' ? 'spinner' : 'trash'}
              className={`w-5 text-(--color-danger) ${deleteBranchFetcher.state !== 'idle' ? 'animate-spin' : ''}`}
            />
            {t('common.delete')}
          </PromptButton>
        )}
        <Button
          className="flex min-w-[12ch] items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
          onPress={() =>
            pullBranchFetcher.submit({
              organizationId,
              projectId,
              workspaceId,
              branch,
            })
          }
        >
          <Icon
            icon={pullBranchFetcher.state !== 'idle' ? 'spinner' : 'cloud-arrow-down'}
            className={`w-5 ${pullBranchFetcher.state !== 'idle' ? 'animate-spin' : ''}`}
          />
          {t('modals.fetch')}
        </Button>
      </div>
    </div>
  );
};

interface Props {
  branches: string[];
  remoteBranches: string[];
  currentBranch: string;
  onClose: () => void;
}

export const SyncBranchesModal = ({ onClose, branches, remoteBranches, currentBranch }: Props) => {
  const { t } = useI18n();
  const { organizationId, projectId, workspaceId } = useParams() as {
    organizationId: string;
    projectId: string;
    workspaceId: string;
  };

  const createBranchFetcher = useIusomniaSyncBranchCreateActionFetcher();

  function sortBranches(branchA: string, branchB: string) {
    if (branchA === 'master') {
      return -1;
    } else if (branchB === 'master') {
      return 1;
    }
    return branchA.localeCompare(branchB);
  }

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
              <createBranchFetcher.Form
                action={href(
                  `/organization/:organizationId/project/:projectId/workspace/:workspaceId/insomnia-sync/branch/create`,
                  {
                    organizationId,
                    projectId,
                    workspaceId,
                  },
                )}
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
                      name="branchName"
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
              </createBranchFetcher.Form>

              {createBranchFetcher.data?.error && (
                <div className="flex shrink-0 items-center gap-2">
                  <Icon icon="triangle-exclamation" className="w-5 text-(--color-danger)" />
                  <span className="text-sm text-(--color-danger)">{createBranchFetcher.data.error}</span>
                </div>
              )}

              <div className="flex max-h-96 flex-1 flex-col divide-y divide-solid divide-(--hl-sm) overflow-hidden rounded-sm border border-solid border-(--hl-sm) select-none">
                <Heading className="p-2 text-sm font-semibold text-(--hl) uppercase">{t('modals.localBranches')}</Heading>
                <GridList
                  aria-label={t('modals.branchesList')}
                  selectionMode="none"
                  items={branches.sort(sortBranches).map(branch => ({
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
                      aria-label={item.name}
                      className="w-full p-2 transition-colors focus:bg-(--hl-sm) focus:outline-hidden"
                    >
                      <LocalBranchItem
                        branch={item.name}
                        isCurrent={item.isCurrent}
                        organizationId={organizationId}
                        projectId={projectId}
                        workspaceId={workspaceId}
                      />
                    </GridListItem>
                  )}
                </GridList>
              </div>

              {remoteBranches.length > 0 && (
                <div className="flex max-h-96 flex-1 flex-col divide-y divide-solid divide-(--hl-sm) overflow-hidden rounded-sm border border-solid border-(--hl-sm) select-none">
                  <Heading className="p-2 text-sm font-semibold text-(--hl) uppercase">{t('modals.remoteBranches')}</Heading>
                  <GridList
                    aria-label={t('modals.remoteBranchesList')}
                    selectionMode="none"
                    items={remoteBranches.sort(sortBranches).map(branch => ({
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
                        aria-label={item.name}
                        className="w-full p-2 transition-colors focus:bg-(--hl-sm) focus:outline-hidden"
                      >
                        <RemoteBranchItem
                          branch={item.name}
                          isCurrent={item.isCurrent}
                          organizationId={organizationId}
                          projectId={projectId}
                          workspaceId={workspaceId}
                        />
                      </GridListItem>
                    )}
                  </GridList>
                </div>
              )}
            </div>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

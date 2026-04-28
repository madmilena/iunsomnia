import { format } from 'date-fns';
import { getProductName } from 'insomnia/src/common/constants';
import { database } from 'insomnia/src/common/database';
import { getWorkspaceLabel } from 'insomnia/src/common/get-workspace-label';
import { exportRequestsHAR, exportWorkspacesHAR } from 'insomnia/src/common/har';
import { getIusomniaV5DataExport } from 'insomnia/src/common/insomnia-v5';
import { isNotNullOrUndefined } from 'insomnia/src/common/misc';
import { strings } from 'insomnia/src/common/strings';
import * as requestOperations from 'insomnia/src/models/helpers/request-operations';
import * as models from 'insomnia/src/models/index';
import { type BaseModel, environment } from 'insomnia/src/models/index';
import { isScratchpadOrganizationId } from 'insomnia/src/models/organization';
import { SegmentEvent } from 'insomnia/src/ui/analytics';
import { Icon } from 'insomnia/src/ui/components/icon';
import { showError, showModal } from 'insomnia/src/ui/components/modals';
import { AskModal } from 'insomnia/src/ui/components/modals/ask-modal';
import { ExportRequestsModal } from 'insomnia/src/ui/components/modals/export-requests-modal';
import { ImportModal } from 'insomnia/src/ui/components/modals/import-modal/import-modal';
import { SelectModal } from 'insomnia/src/ui/components/modals/select-modal';
import type { Organization } from 'insomnia-api';
import React, { type FC, Fragment, useEffect, useState } from 'react';
import { Button, Heading, ListBox, ListBoxItem, Popover, Select, SelectValue } from 'react-aria-components';
import { href, useParams } from 'react-router';

import type { Environment, Project, Workspace } from '~/insomnia-data';
import { useRootLoaderData } from '~/root';
import { useOrganizationLoaderData } from '~/routes/organization';
import { useProjectListWorkspacesLoaderFetcher } from '~/routes/organization.$organizationId.project.$projectId.list-workspaces';
import { useProjectMoveActionFetcher } from '~/routes/organization.$organizationId.project.$projectId.move';
import { useProjectMoveWorkspaceActionFetcher } from '~/routes/organization.$organizationId.project.$projectId.move-workspace';
import { useWorkspaceLoaderData } from '~/routes/organization.$organizationId.project.$projectId.workspace.$workspaceId';
import { useUntrackedProjectsLoaderFetcher } from '~/routes/untracked-projects';
import { AlertModal } from '~/ui/components/modals/alert-modal';
import { ImportProjectsModal } from '~/ui/components/modals/import-modal/import-projects-modal';
import { useOrganizationPermissions } from '~/ui/hooks/use-organization-features';
import { usePlanData } from '~/ui/hooks/use-plan';
import { type TranslationKey, useI18n } from '~/ui/i18n';

const VALUE_YAML = 'yaml';
const VALUE_HAR = 'har';

export type SelectedFormat = typeof VALUE_HAR | typeof VALUE_YAML;
type Translate = ReturnType<typeof useI18n>['t'];

const translate = (
  t: Translate | undefined,
  key: TranslationKey,
  fallback: string,
  params?: Record<string, string | number>,
) => t?.(key, params) ?? fallback;

const showSelectExportTypeModal = ({
  onDone,
  t,
}: {
  onDone: (selectedFormat: SelectedFormat) => Promise<void>;
  t?: Translate;
}) => {
  const options = [
    {
      name: 'Iusomnia v5',
      value: VALUE_YAML,
    },
    {
      name: 'HAR – HTTP Archive Format',
      value: VALUE_HAR,
    },
  ];

  let lastFormat = window.localStorage.getItem('insomnia.lastExportFormat');
  if (lastFormat === 'json') {
    window.localStorage.setItem('insomnia.lastExportFormat', VALUE_YAML);
    lastFormat = VALUE_YAML;
  }

  const defaultValue = options.find(({ value }) => value === lastFormat) ? lastFormat : VALUE_YAML;

  showModal(SelectModal, {
    title: translate(t, 'settings.importExport.selectExportType', 'Select Export Type'),
    value: defaultValue,
    options,
    message: translate(t, 'settings.importExport.whichFormatExportAs', 'Which format would you like to export as?'),
    onDone: async selectedFormat => {
      if (selectedFormat) {
        window.localStorage.setItem('insomnia.lastExportFormat', selectedFormat);
        await onDone(selectedFormat as SelectedFormat);
      }
    },
  });
};

const showExportPrivateEnvironmentsModal = async (t?: Translate) => {
  return new Promise<boolean>(resolve => {
    showModal(AskModal, {
      title: translate(t, 'settings.importExport.exportPrivateEnvironments', 'Export Private Environments?'),
      message: translate(
        t,
        'settings.importExport.includePrivateEnvironments',
        'Do you want to include private environments in your export?',
      ),
      onDone: async (isYes: boolean) => {
        if (isYes) {
          resolve(true);
        } else {
          resolve(false);
        }
      },
    });
  });
};

const showSaveExportedFileDialog = async ({
  exportedFileNamePrefix,
  selectedFormat,
  t,
}: {
  exportedFileNamePrefix: string;
  selectedFormat: SelectedFormat;
  t?: Translate;
}) => {
  const date = format(Date.now(), 'yyyy-MM-dd');
  const name = exportedFileNamePrefix.replace(/ /g, '-');
  const lastDir = window.localStorage.getItem('insomnia.lastExportPath');
  const dir = lastDir || window.app.getPath('desktop');
  const options = {
    title: translate(t, 'settings.importExport.exportIusomniaData', 'Export Iusomnia Data'),
    buttonLabel: translate(t, 'common.export', 'Export'),
    defaultPath: `${window.path.join(dir, `${name}_${date}`)}.${selectedFormat}`,
  };
  const { filePath } = await window.dialog.showSaveDialog(options);
  return filePath || null;
};

const showSaveExportedFolderDialog = async (t?: Translate) => {
  const lastDir = window.localStorage.getItem('insomnia.lastExportPath');
  const dir = lastDir || window.app.getPath('desktop');
  const options = {
    title: translate(t, 'settings.importExport.exportIusomniaData', 'Export Iusomnia Data'),
    buttonLabel: translate(t, 'common.export', 'Export'),
    properties: ['openDirectory'],
    defaultPath: dir,
  } satisfies Electron.OpenDialogOptions;
  const { filePaths } = await window.dialog.showOpenDialog(options);
  const filePath = filePaths[0];

  return filePath || null;
};

async function writeExportedFileToFileSystem(filename: string, data: string) {
  // Remember last exported path
  window.localStorage.setItem('insomnia.lastExportPath', window.path.dirname(filename));
  await window.main.writeFile({
    path: filename,
    content: data,
  });
}

export const exportProjectToFile = (
  activeProjectName: string,
  workspacesForActiveProject: Workspace[],
  t?: Translate,
) => {
  if (!workspacesForActiveProject.length) {
    showModal(AlertModal, {
      title: translate(t, 'settings.importExport.cannotExport', 'Cannot export'),
      message: (
        <>
          {translate(t, 'settings.importExport.noWorkspacesToExportIn', 'There are no workspaces to export in the')}{' '}
          <strong>{activeProjectName}</strong>{' '}
          {strings.project.singular.toLowerCase()}.
        </>
      ),
    });
    return;
  }

  showSelectExportTypeModal({
    t,
    onDone: async selectedFormat => {
      const baseEnvironments = await database.find<Environment>(environment.type, {
        parentId: { $in: workspacesForActiveProject.map(w => w._id) },
      });

      const subEnvironments = await database.find<Environment>(environment.type, {
        parentId: { $in: baseEnvironments.map(w => w._id) },
      });
      const shouldPrompt = subEnvironments.some(e => e.isPrivate);
      let shouldExportPrivateEnvironments = false;
      if (shouldPrompt) {
        shouldExportPrivateEnvironments = await showExportPrivateEnvironmentsModal(t);
      }

      try {
        switch (selectedFormat) {
          case VALUE_HAR: {
            const fileName = await showSaveExportedFileDialog({
              exportedFileNamePrefix: activeProjectName,
              selectedFormat,
              t,
            });

            if (!fileName) {
              return;
            }
            const stringifiedExport = await exportWorkspacesHAR(
              workspacesForActiveProject,
              shouldExportPrivateEnvironments,
            );

            await writeExportedFileToFileSystem(fileName, stringifiedExport);

            break;
          }

          case VALUE_YAML: {
            const dirPath = await showSaveExportedFolderDialog(t);
            if (!dirPath) {
              return;
            }

            if (!dirPath) {
              return;
            }

            const projectName = activeProjectName.replace(/ /g, '-');
            const insomniaProjectExportFolder = window.path.join(
              dirPath,
              `insomnia-export.${projectName}.${Date.now()}`,
            );

            for (const workspace of workspacesForActiveProject) {
              const workspaceName = workspace.name.replace(/ /g, '-');
              const fileName = window.path.join(insomniaProjectExportFolder, `${workspaceName}-${workspace._id}.yaml`);
              const stringifiedExport = await getIusomniaV5DataExport({
                workspaceId: workspace._id,
                includePrivateEnvironments: shouldExportPrivateEnvironments,
              });
              await writeExportedFileToFileSystem(fileName, stringifiedExport);
            }
            break;
          }

          default: {
            throw new Error(`selected export format "${selectedFormat}" is invalid`);
          }
        }
        window.main.trackSegmentEvent({ event: SegmentEvent.exportCompleted });
      } catch (err) {
        showError({
          title: translate(t, 'settings.importExport.exportFailed', 'Export Failed'),
          error: err,
          message: translate(
            t,
            'settings.importExport.exportFailedUnexpected',
            'Export failed due to an unexpected error',
          ),
        });
        return;
      }
    },
  });
};

export const exportMockServerToFile = async (workspace: Workspace, t?: Translate) => {
  const fileName = await showSaveExportedFileDialog({
    exportedFileNamePrefix: workspace.name,
    selectedFormat: 'yaml',
    t,
  });
  if (!fileName) {
    return;
  }

  try {
    const stringifiedExport = await getIusomniaV5DataExport({
      workspaceId: workspace._id,
      includePrivateEnvironments: false,
    });
    await writeExportedFileToFileSystem(fileName, stringifiedExport);
    window.main.trackSegmentEvent({
      event: SegmentEvent.dataExport,
      properties: { type: 'yaml', scope: 'mock-server' },
    });
  } catch (err) {
    showError({
      title: translate(t, 'settings.importExport.exportFailed', 'Export Failed'),
      error: err,
      message: translate(t, 'settings.importExport.exportFailedUnexpected', 'Export failed due to an unexpected error'),
    });
    return;
  }
};

export const exportGlobalEnvironmentToFile = async (workspace: Workspace, t?: Translate) => {
  const fileName = await showSaveExportedFileDialog({
    exportedFileNamePrefix: workspace.name,
    selectedFormat: 'yaml',
    t,
  });
  if (!fileName) {
    return;
  }

  const baseEnvironments = await database.find<Environment>(environment.type, {
    parentId: workspace._id,
  });

  const subEnvironments = await database.find<Environment>(environment.type, {
    parentId: { $in: baseEnvironments.map(w => w._id) },
  });
  const shouldPrompt = subEnvironments.some(e => e.isPrivate);
  let shouldExportPrivateEnvironments = false;
  if (shouldPrompt) {
    shouldExportPrivateEnvironments = await showExportPrivateEnvironmentsModal(t);
  }

  try {
    const stringifiedExport = await getIusomniaV5DataExport({
      workspaceId: workspace._id,
      includePrivateEnvironments: shouldExportPrivateEnvironments,
    });
    await writeExportedFileToFileSystem(fileName, stringifiedExport);
    window.main.trackSegmentEvent({
      event: SegmentEvent.dataExport,
      properties: { type: 'yaml', scope: 'environment' },
    });
  } catch (err) {
    showError({
      title: translate(t, 'settings.importExport.exportFailed', 'Export Failed'),
      error: err,
      message: translate(t, 'settings.importExport.exportFailedUnexpected', 'Export failed due to an unexpected error'),
    });
    return;
  }
};

export const exportRequestsToFile = (workspaceId: string, requestIds: string[], t?: Translate) => {
  showSelectExportTypeModal({
    t,
    onDone: async selectedFormat => {
      const requests: BaseModel[] = [];
      for (const requestId of requestIds) {
        const request = await requestOperations.getById(requestId);
        if (request) {
          requests.push(request);
        }
      }
      const [baseEnvironment] = await database.find<Environment>(environment.type, {
        parentId: workspaceId,
      });

      const subEnvironments = await database.find<Environment>(environment.type, {
        parentId: baseEnvironment?._id,
      });
      const shouldPrompt = subEnvironments.some(e => e.isPrivate);
      let shouldExportPrivateEnvironments = false;
      if (shouldPrompt) {
        shouldExportPrivateEnvironments = await showExportPrivateEnvironmentsModal(t);
      }
      const fileName = await showSaveExportedFileDialog({
        exportedFileNamePrefix: 'Iusomnia',
        selectedFormat,
        t,
      });

      if (!fileName) {
        return;
      }

      let stringifiedExport = '';

      try {
        switch (selectedFormat) {
          case VALUE_HAR: {
            stringifiedExport = await exportRequestsHAR(requests, shouldExportPrivateEnvironments);
            break;
          }

          case VALUE_YAML: {
            stringifiedExport = await getIusomniaV5DataExport({
              workspaceId,
              includePrivateEnvironments: shouldExportPrivateEnvironments,
              requestIds,
            });
            break;
          }

          default: {
            throw new Error(`selected export format "${selectedFormat}" is invalid`);
          }
        }
        await writeExportedFileToFileSystem(fileName, stringifiedExport);
        window.main.trackSegmentEvent({ event: SegmentEvent.dataExport, properties: { type: selectedFormat } });
      } catch (err) {
        showError({
          title: translate(t, 'settings.importExport.exportFailed', 'Export Failed'),
          error: err,
          message: translate(
            t,
            'settings.importExport.exportFailedUnexpected',
            'Export failed due to an unexpected error',
          ),
        });
        return;
      }
    },
  });
};

export const exportMcpClientToFile = async (workspace: Workspace, t?: Translate) => {
  const fileName = await showSaveExportedFileDialog({
    exportedFileNamePrefix: workspace.name,
    selectedFormat: 'yaml',
    t,
  });
  if (!fileName) {
    return;
  }

  try {
    const stringifiedExport = await getIusomniaV5DataExport({
      workspaceId: workspace._id,
      includePrivateEnvironments: false,
    });
    await writeExportedFileToFileSystem(fileName, stringifiedExport);
    window.main.trackSegmentEvent({
      event: SegmentEvent.dataExport,
      properties: { type: 'yaml', scope: 'mcp' },
    });
  } catch (err) {
    showError({
      title: translate(t, 'settings.importExport.exportFailed', 'Export Failed'),
      error: err,
      message: translate(t, 'settings.importExport.exportFailedUnexpected', 'Export failed due to an unexpected error'),
    });
    return;
  }
};

export async function exportWorkspaceData({
  workspace,
  dirPath,
  includePrivateEnvironments,
}: {
  workspace: Workspace;
  dirPath: string;
  includePrivateEnvironments: boolean;
}) {
  const insomniaExport = await getIusomniaV5DataExport({ workspaceId: workspace._id, includePrivateEnvironments });

  try {
    const workspaceName = workspace.name.replace(/ /g, '-');
    const filePath = window.path.join(dirPath, `${workspaceName}-${workspace._id}.yaml`);
    await writeExportedFileToFileSystem(filePath, insomniaExport);
  } catch (error) {
    console.error(error);
  }
}

export async function exportAllData({ dirPath, t }: { dirPath: string; t?: Translate }): Promise<void> {
  const workspaces = await database.find<Workspace>(models.workspace.type);

  const baseEnvironments = await database.find<Environment>(environment.type, {
    parentId: { $in: workspaces.map(w => w._id) },
  });

  const subEnvironments = await database.find<Environment>(environment.type, {
    parentId: { $in: baseEnvironments.map(w => w._id) },
  });
  const shouldPrompt = subEnvironments.some(e => e.isPrivate);
  let includePrivateEnvironments = false;
  if (shouldPrompt) {
    includePrivateEnvironments = await showExportPrivateEnvironmentsModal(t);
  }

  const insomniaExportFolder = window.path.join(dirPath, `insomnia-export.${Date.now()}`);

  for (const workspace of workspaces) {
    await exportWorkspaceData({
      workspace,
      dirPath: insomniaExportFolder,
      includePrivateEnvironments,
    });
  }
}

const UntrackedProject = ({
  project,
  organizationId,
  organizations,
}: {
  project: Project & { workspacesCount: number };
  organizationId: string;
  organizations: Organization[];
}) => {
  const moveProjectFetcher = useProjectMoveActionFetcher();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const { t } = useI18n();

  return (
    <div key={project._id} className="flex items-center justify-between gap-2 py-2">
      <div className="flex flex-col gap-1">
        <Heading className="flex items-center gap-2 text-base font-semibold">
          {project.name}
          <span className="text-xs text-(--hl)">Id: {project._id}</span>
        </Heading>
        <p className="text-sm">
          {t(
            project.workspacesCount === 1
              ? 'settings.importExport.projectContainsFile'
              : 'settings.importExport.projectContainsFiles',
            {
              count: project.workspacesCount,
            },
          )}
        </p>
      </div>
      <moveProjectFetcher.Form
        action={href(`/organization/:organizationId/project/:projectId/move`, {
          organizationId,
          projectId: project._id,
        })}
        method="POST"
        className="group flex items-center gap-2"
      >
        <Select
          aria-label={t('settings.importExport.selectOrganization')}
          name="organizationId"
          onSelectionChange={key => {
            key && setSelectedOrganizationId(key.toString());
          }}
          selectedKey={selectedOrganizationId}
          isDisabled={organizations.length === 0}
        >
          <Button className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset disabled:cursor-not-allowed disabled:bg-(--hl-xs) aria-pressed:bg-(--hl-sm) data-pressed:bg-(--hl-xs)">
            <SelectValue<Organization> className="flex items-center justify-center gap-2 truncate">
              {({ selectedItem }) => {
                if (!selectedItem) {
                  return (
                    <Fragment>
                      <span>{t('settings.importExport.selectOrganization')}</span>
                    </Fragment>
                  );
                }

                return <Fragment>{selectedItem.display_name}</Fragment>;
              }}
            </SelectValue>
            <Icon icon="caret-down" />
          </Button>
          <Popover className="flex min-w-max flex-col overflow-y-hidden">
            <ListBox
              items={organizations}
              className="min-w-max overflow-y-auto rounded-md border border-solid border-(--hl-sm) bg-(--color-bg) py-2 text-sm shadow-lg select-none focus:outline-hidden"
            >
              {item => (
                <ListBoxItem
                  id={item.id}
                  key={item.id}
                  className="flex h-(--line-height-xs) w-full items-center gap-2 bg-transparent px-(--padding-md) whitespace-nowrap text-(--color-font) transition-colors hover:bg-(--hl-sm) focus:bg-(--hl-xs) focus:outline-hidden disabled:cursor-not-allowed aria-selected:font-bold"
                  aria-label={item.name}
                  textValue={item.name}
                  value={item}
                >
                  {({ isSelected }) => (
                    <Fragment>
                      {item.display_name}
                      {isSelected && <Icon icon="check" className="justify-self-end text-(--color-success)" />}
                    </Fragment>
                  )}
                </ListBoxItem>
              )}
            </ListBox>
          </Popover>
        </Select>
        <Button
          isDisabled={organizations.length === 0 || !selectedOrganizationId || moveProjectFetcher.state !== 'idle'}
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all group-invalid:opacity-30 hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset disabled:cursor-not-allowed disabled:bg-(--hl-xs) aria-pressed:bg-(--hl-sm)"
        >
          {t('common.move')}
        </Button>
      </moveProjectFetcher.Form>
    </div>
  );
};

const UntrackedWorkspace = ({
  workspace,
  organizationId,
  projects,
}: {
  workspace: Workspace;
  organizationId: string;
  projects: Project[];
}) => {
  const moveWorkspaceFetcher = useProjectMoveWorkspaceActionFetcher();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { t } = useI18n();

  return (
    <div key={workspace._id} className="flex items-center justify-between gap-2 py-2">
      <div className="flex flex-col gap-1">
        <Heading className="flex items-center gap-2 text-base font-semibold">
          {workspace.name}
          <span className="text-xs text-(--hl)">Id: {workspace._id}</span>
        </Heading>
      </div>
      <moveWorkspaceFetcher.Form
        action={href(`/organization/:organizationId/project/:projectId/move-workspace`, {
          organizationId,
          projectId: selectedProjectId || '',
        })}
        method="POST"
        className="group flex items-center gap-2"
      >
        <input type="hidden" name="workspaceId" value={workspace._id} />
        <Select
          aria-label={t('settings.importExport.selectProject')}
          name="projectId"
          onSelectionChange={key => {
            key && setSelectedProjectId(key.toString());
          }}
          selectedKey={selectedProjectId}
          isDisabled={projects.length === 0}
        >
          <Button className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset disabled:cursor-not-allowed disabled:bg-(--hl-xs) aria-pressed:bg-(--hl-sm) data-pressed:bg-(--hl-xs)">
            <SelectValue<Project> className="flex items-center justify-center gap-2 truncate">
              {({ selectedItem }) => {
                if (!selectedItem) {
                  return (
                    <Fragment>
                      <span>{t('settings.importExport.selectProject')}</span>
                    </Fragment>
                  );
                }

                return <Fragment>{selectedItem.name}</Fragment>;
              }}
            </SelectValue>
            <Icon icon="caret-down" />
          </Button>
          <Popover className="flex min-w-max flex-col overflow-y-hidden">
            <ListBox
              className="min-w-max overflow-y-auto rounded-md border border-solid border-(--hl-sm) bg-(--color-bg) py-2 text-sm shadow-lg select-none focus:outline-hidden"
              items={projects.map(project => ({
                ...project,
                id: project._id,
              }))}
            >
              {item => (
                <ListBoxItem
                  id={item.id}
                  key={item.id}
                  className="flex h-(--line-height-xs) w-full items-center gap-2 bg-transparent px-(--padding-md) whitespace-nowrap text-(--color-font) transition-colors hover:bg-(--hl-sm) focus:bg-(--hl-xs) focus:outline-hidden disabled:cursor-not-allowed aria-selected:font-bold"
                  aria-label={item.name}
                  textValue={item.name}
                  value={item}
                >
                  {({ isSelected }) => (
                    <Fragment>
                      {item.name}
                      {isSelected && <Icon icon="check" className="justify-self-end text-(--color-success)" />}
                    </Fragment>
                  )}
                </ListBoxItem>
              )}
            </ListBox>
          </Popover>
        </Select>
        <Button
          isDisabled={projects.length === 0 || !selectedProjectId || moveWorkspaceFetcher.state !== 'idle'}
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all group-invalid:opacity-30 hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset disabled:cursor-not-allowed disabled:bg-(--hl-xs) aria-pressed:bg-(--hl-sm)"
        >
          {t('common.move')}
        </Button>
      </moveWorkspaceFetcher.Form>
    </div>
  );
};

interface Props {
  hideSettingsModal: () => void;
  onModalChange?: (isOpen: boolean) => void;
}

export const ImportExport: FC<Props> = ({ hideSettingsModal, onModalChange }) => {
  const { t } = useI18n();
  const { organizationId, projectId, workspaceId } = useParams() as {
    organizationId: string;
    projectId: string;
    workspaceId?: string;
  };
  const organizationData = useOrganizationLoaderData();
  const organizations = organizationData?.organizations || [];

  const { features } = useOrganizationPermissions();
  const { isEnterprisePlan } = usePlanData();

  const untrackedProjectsFetcher = useUntrackedProjectsLoaderFetcher();

  useEffect(() => {
    const isIdleAndUninitialized = untrackedProjectsFetcher.state === 'idle' && !untrackedProjectsFetcher.data;
    if (isIdleAndUninitialized) {
      untrackedProjectsFetcher.load();
    }
  }, [untrackedProjectsFetcher, organizationId]);

  const untrackedProjects = untrackedProjectsFetcher.data?.untrackedProjects || [];
  const untrackedWorkspaces = untrackedProjectsFetcher.data?.untrackedWorkspaces || [];

  const workspaceData = useWorkspaceLoaderData();
  const activeWorkspaceName = workspaceData?.activeWorkspace.name;
  const { workspaceCount, userSession } = useRootLoaderData()!;
  const workspacesFetcher = useProjectListWorkspacesLoaderFetcher();
  useEffect(() => {
    const isIdleAndUninitialized = workspacesFetcher.state === 'idle' && !workspacesFetcher.data;
    if (isIdleAndUninitialized && organizationId && projectId && !isScratchpadOrganizationId(organizationId)) {
      workspacesFetcher.load({
        organizationId,
        projectId,
      });
    }
  }, [organizationId, projectId, workspacesFetcher]);
  const projectLoaderData = workspacesFetcher?.data;
  const workspacesForActiveProject = projectLoaderData?.files.map(w => w.workspace).filter(isNotNullOrUndefined) || [];
  const activeProject = projectLoaderData?.activeProject;
  const projectName = activeProject?.name ?? getProductName();
  const projects = projectLoaderData?.projects || [];
  const organizationName =
    organizationData?.organizations.find(org => org.id === organizationId)?.display_name || 'Organization';

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportProjectsModalOpen, setIsImportProjectsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    onModalChange?.(isImportModalOpen || isImportProjectsModalOpen || isExportModalOpen);
  }, [isImportModalOpen, isImportProjectsModalOpen, isExportModalOpen, onModalChange]);

  const handleExportProjectToFile = () => {
    exportProjectToFile(projectName, workspacesForActiveProject, t);
    hideSettingsModal();
  };
  const isLoggedIn = userSession.id || organizationId || activeProject;
  const isScratchPadWorkspace = models.workspace.isScratchpad(workspaceData?.activeWorkspace);
  const hasUntrackedWorkspaces = untrackedWorkspaces.length > 0;
  const hasUntrackedProjects = untrackedProjects.length > 0;
  const showImportButtons =
    !isScratchPadWorkspace && (activeProject || features.bulkImport.enabled || isEnterprisePlan);
  if (!isScratchPadWorkspace && !isLoggedIn) {
    return (
      <Button
        className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
        onPress={async () => {
          const { filePaths, canceled } = await window.dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
            buttonLabel: t('settings.importExport.select'),
            title: t('settings.importExport.exportAllIusomniaData'),
          });

          if (canceled) {
            return;
          }

          const [dirPath] = filePaths;

          try {
            dirPath &&
              (await exportAllData({
                dirPath,
                t,
              }));
          } catch (e) {
            showModal(AlertModal, {
              title: t('settings.importExport.exportFailed'),
              message: t('settings.importExport.exportErrorMessage'),
            });
            console.error(e);
          }

          showModal(AlertModal, {
            title: t('settings.importExport.exportComplete'),
            message: t('settings.importExport.exportCompleteMessage'),
          });
          window.main.trackSegmentEvent({
            event: SegmentEvent.exportAllCollections,
          });
        }}
        aria-label={t('settings.importExport.exportAllData')}
      >
        <Icon icon="file-export" />
        <span>{t('settings.importExport.exportAllDataWithFiles', { count: workspaceCount })}</span>
      </Button>
    );
  }

  return (
    <Fragment>
      <div data-testid="import-export-tab" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-md border border-solid border-(--hl-md) p-4">
          <Heading className="flex items-center gap-2 text-lg font-bold">
            <Icon icon="file-export" /> {t('common.export')}
          </Heading>
          <div className="flex flex-wrap gap-2">
            {activeProject &&
              (workspaceData?.activeWorkspace ? (
                <ExportSection
                  workspace={workspaceData.activeWorkspace}
                  projectName={projectName}
                  setIsExportModalOpen={setIsExportModalOpen}
                  handleExportProjectToFile={handleExportProjectToFile}
                />
              ) : (
                <Button
                  className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
                  onPress={handleExportProjectToFile}
                  data-testid="export-project-button"
                >
                  {t('settings.importExport.exportFilesFromProject', {
                    projectName,
                    projectLabel: strings.project.singular,
                  })}
                </Button>
              ))}
            <Button
              className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
              onPress={async () => {
                const { filePaths, canceled } = await window.dialog.showOpenDialog({
                  properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
                  buttonLabel: t('settings.importExport.select'),
                  title: t('settings.importExport.exportAllIusomniaData'),
                });

                if (canceled) {
                  return;
                }

                const [dirPath] = filePaths;

                try {
                  dirPath &&
                    (await exportAllData({
                      dirPath,
                      t,
                    }));
                } catch (e) {
                  showModal(AlertModal, {
                    title: t('settings.importExport.exportFailed'),
                    message: t('settings.importExport.exportErrorMessage'),
                  });
                  console.error(e);
                }

                showModal(AlertModal, {
                  title: t('settings.importExport.exportComplete'),
                  message: t('settings.importExport.exportCompleteMessage'),
                });
                window.main.trackSegmentEvent({
                  event: SegmentEvent.exportAllCollections,
                });
              }}
              aria-label={t('settings.importExport.exportAllData')}
            >
              <Icon icon="file-export" />
              <span>{t('settings.importExport.exportAllDataWithFiles', { count: workspaceCount })}</span>
            </Button>

            <Button
              className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
              isDisabled={!userSession.id}
              onPress={() => window.main.openInBrowser('https://iusomnia.local/create-run-button')}
            >
              <i className="fa fa-file-import" />
              {t('settings.importExport.createRunButton')}
            </Button>
          </div>
        </div>
        {showImportButtons && (
          <div className="flex flex-col gap-2 rounded-md border border-solid border-(--hl-md) p-4">
            <Heading className="flex items-center gap-2 text-lg font-bold">
              <Icon icon="file-import" /> {t('common.import')}
            </Heading>
            <div className="flex flex-wrap gap-2">
              {activeProject && (
                <Button
                  className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
                  isDisabled={
                    workspaceData?.activeWorkspace && models.workspace.isScratchpad(workspaceData?.activeWorkspace)
                  }
                  onPress={() => setIsImportModalOpen(true)}
                >
                  <Icon icon="file-import" />
                  {t('settings.importExport.importToProject', {
                    projectName,
                    projectLabel: strings.project.singular,
                  })}
                </Button>
              )}
              {features.bulkImport.enabled ? (
                <Button
                  className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
                  isDisabled={
                    workspaceData?.activeWorkspace && models.workspace.isScratchpad(workspaceData?.activeWorkspace)
                  }
                  onPress={() => setIsImportProjectsModalOpen(true)}
                >
                  <Icon icon="file-import" />
                  {t('settings.importExport.importProjectsToOrganization', {
                    organizationName,
                    organizationLabel: strings.organization.singular,
                  })}
                </Button>
              ) : isEnterprisePlan ? (
                <p className="text-sm">
                  {t('settings.importExport.multiProjectImportSupportPrefix')}{' '}
                  <a className="text-(--color-surprise)" href="mailto:support@iusomnia.local">
                    support@iusomnia.local
                  </a>{' '}
                  {t('settings.importExport.multiProjectImportSupportSuffix')}
                </p>
              ) : null}
            </div>
          </div>
        )}
        {hasUntrackedProjects && (
          <div className="flex flex-col gap-2 rounded-md border border-solid border-(--hl-md) p-4">
            <div className="flex flex-col gap-1">
              <Heading className="flex items-center gap-2 text-lg font-bold">
                <Icon icon="cancel" /> {t('settings.importExport.orphanedProjects', { count: untrackedProjects.length })}
              </Heading>
              <p className="text-sm text-(--hl)">
                <Icon icon="info-circle" /> {t('settings.importExport.orphanedProjectsDescription')}
              </p>
            </div>
            <div className="flex flex-col gap-1 divide-y divide-solid divide-(--hl-md) overflow-y-auto">
              {untrackedProjects.map(project => (
                <UntrackedProject
                  key={project._id}
                  project={project}
                  organizationId={organizationId}
                  organizations={organizations}
                />
              ))}
            </div>
          </div>
        )}
        {hasUntrackedWorkspaces && projects.length > 0 && (
          <div className="flex flex-col gap-2 rounded-md border border-solid border-(--hl-md) p-4">
            <div className="flex flex-col gap-1">
              <Heading className="flex items-center gap-2 text-lg font-bold">
                <Icon icon="cancel" /> {t('settings.importExport.untrackedFiles', { count: untrackedWorkspaces.length })}
              </Heading>
              <p className="text-sm text-(--hl)">
                <Icon icon="info-circle" /> {t('settings.importExport.untrackedFilesDescription')}
              </p>
            </div>
            <div className="flex flex-col gap-1 divide-y divide-solid divide-(--hl-md) overflow-y-auto">
              {untrackedWorkspaces.map(workspace => (
                <UntrackedWorkspace
                  key={workspace._id}
                  workspace={workspace}
                  organizationId={organizationId}
                  projects={projects}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      {isImportModalOpen && (
        <ImportModal
          onHide={() => setIsImportModalOpen(false)}
          from={{ type: 'file' }}
          projectName={projectName}
          workspaceName={activeWorkspaceName}
          organizationId={organizationId}
          defaultProjectId={projectId}
          defaultWorkspaceId={workspaceId}
        />
      )}
      {isImportProjectsModalOpen && (
        <ImportProjectsModal onHide={() => setIsImportProjectsModalOpen(false)} organizationId={organizationId} />
      )}
      {isExportModalOpen && workspaceData?.activeWorkspace && (
        <ExportRequestsModal
          workspaceIdToExport={workspaceData.activeWorkspace._id}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </Fragment>
  );
};

const ExportSection = ({
  workspace,
  projectName,
  setIsExportModalOpen,
  handleExportProjectToFile,
}: {
  workspace: Workspace;
  projectName: string;
  setIsExportModalOpen: (value: boolean) => void;
  handleExportProjectToFile: () => void;
}) => {
  const { t } = useI18n();

  if (models.workspace.isScratchpad(workspace)) {
    return (
      <Button
        className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
        onPress={() => setIsExportModalOpen(true)}
      >
        {t('settings.importExport.exportWorkspace', {
          workspaceName: workspace.name,
          workspaceLabel: getWorkspaceLabel(workspace).singular,
        })}
      </Button>
    );
  }

  return (
    <>
      <Button
        className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
        onPress={() => setIsExportModalOpen(true)}
      >
        {t('settings.importExport.exportWorkspace', {
          workspaceName: workspace.name,
          workspaceLabel: getWorkspaceLabel(workspace).singular,
        })}
      </Button>
      <Button
        className="flex items-center justify-center gap-2 rounded-xs border border-solid border-(--hl-md) px-4 py-1 text-sm font-semibold text-(--color-font) ring-1 ring-transparent transition-all hover:bg-(--hl-xs) focus:ring-(--hl-md) focus:ring-inset aria-pressed:bg-(--hl-sm)"
        onPress={handleExportProjectToFile}
        data-testid="export-project-button"
      >
        {t('settings.importExport.exportProject', { projectName, projectLabel: strings.project.singular })}
      </Button>
    </>
  );
};

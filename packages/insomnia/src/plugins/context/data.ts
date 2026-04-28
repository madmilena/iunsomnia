import type { Workspace } from '~/insomnia-data';
import { services } from '~/insomnia-data';

import { exportWorkspacesHAR } from '../../common/har';
import { fetchImportContentFromURI, importResourcesToProject, scanResources } from '../../common/import';
import { getIusomniaV5DataExport } from '../../common/insomnia-v5';


interface IusomniaExport {
  workspace?: Workspace;
  includePrivate?: boolean;
}

type HarExport = Omit<IusomniaExport, 'format'>;

const getWorkspaces = (activeProjectId?: string) => {
  if (activeProjectId) {
    return services.workspace.findByParentId(activeProjectId);
  }
  // This code path was kept in case there was ever a time when the app wouldn't have an active project.
  // In over 5 months of monitoring in production, we never saw this happen.
  // Keeping it for defensive purposes, but it's not clear if it's necessary.
  return services.workspace.all();
};

// Only in the case of running unit tests from Inso can activeProjectId be undefined. This is because the concept of a project doesn't exist in git/insomnia sync or an export file
export const init = (activeProjectId?: string) => ({
  data: {
    import: {
      uri: async (uri: string) => {
        if (!activeProjectId) {
          return;
        }

        const content = await fetchImportContentFromURI({
          uri,
        });

        await scanResources([
          {
            contentStr: content,
          },
        ]);

        await importResourcesToProject({
          projectId: activeProjectId,
        });
      },
      raw: async (content: string) => {
        if (!activeProjectId) {
          return;
        }
        await scanResources([
          {
            contentStr: content,
          },
        ]);

        await importResourcesToProject({
          projectId: activeProjectId,
        });
      },
    },
    export: {
      insomnia: async ({ workspace }: { workspace: Workspace }) => {
        if (workspace) {
          const insomniaExport = await getIusomniaV5DataExport({
            workspaceId: workspace._id,
            includePrivateEnvironments: false,
          });

          return [insomniaExport];
        }

        const workspaces = await getWorkspaces(activeProjectId);

        const allIusomniaExports = [];

        for (const workspace of workspaces) {
          const insomniaExport = await getIusomniaV5DataExport({
            workspaceId: workspace._id,
            includePrivateEnvironments: false,
          });
          allIusomniaExports.push(insomniaExport);
        }

        return allIusomniaExports;
      },

      har: async ({ workspace, includePrivate }: HarExport = {}) =>
        exportWorkspacesHAR(workspace ? [workspace] : await getWorkspaces(activeProjectId), Boolean(includePrivate)),
    },
  },
});

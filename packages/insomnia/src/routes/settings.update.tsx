import type { Settings } from '~/insomnia-data';
import { services } from '~/insomnia-data';
import { createFetcherSubmitHook } from '~/utils/router';

import type { Route } from './+types/settings.update';

export async function clientAction({ request }: Route.ClientActionArgs) {
  const patch = (await request.json()) as Partial<Settings>;
  if ('enableAnalytics' in patch) {
    patch.enableAnalytics = false;
  }
  if ('updateAutomatically' in patch) {
    patch.updateAutomatically = false;
  }
  await services.settings.patch(patch);
  return null;
}

export const useSettingsUpdateActionFetcher = createFetcherSubmitHook(
  submit =>
    ({ patch }: { patch: Partial<Settings> }) => {
      return submit(JSON.stringify(patch), {
        method: 'POST',
        action: '/settings/update',
        encType: 'application/json',
      });
    },
  clientAction,
);

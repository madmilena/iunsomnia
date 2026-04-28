import * as Sentry from '@sentry/electron/main';

import { SENTRY_OPTIONS } from '../common/sentry';

/**
 * Watch setting for changes. This must be called after the DB is initialized.
 */
export function sentryWatchAnalyticsEnabled() {
}

// some historical context:
// At beginning We are vendoring ElectronOfflineNetTransport just to be able to control whether or not sending is allowed
// https://github.com/getsentry/sentry-electron/issues/489
// After the official support. Now we could use the transportOptions.shouldSend to control whether or not sending is allowed
// https://github.com/getsentry/sentry-electron/pull/889
// docs: https://docs.sentry.io/platforms/javascript/guides/electron/
export function initializeSentry() {
  Sentry.init({
    ...SENTRY_OPTIONS,
    transportOptions: {
      /**
       * Called before we attempt to send an envelope to Sentry.
       *
       * If this function returns false, `shouldStore` will be called to determine if the envelope should be stored.
       *
       * Default: () => true
       *
       * @param envelope The envelope that will be sent.
       * @returns Whether we should attempt to send the envelope
       */
      shouldSend: () => false,
    },
    // comment out anr integration for now (Too much reporting resulted in excess capacity usage)
    // integrations: isDevelopment() ? [] : [
    //   Sentry.anrIntegration({ captureStackTrace: true }),
    // ],
  });
}

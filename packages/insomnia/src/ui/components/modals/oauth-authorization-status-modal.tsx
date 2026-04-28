import React, { type FC, useEffect, useRef, useState } from 'react';

import type { OAuth2AuthorizationStatusType } from '~/common/constants';
import { useDefaultBrowserRedirectActionFetcher } from '~/routes/auth.default-browser-redirect';
import { useI18n } from '~/ui/i18n';

import { invariant } from '../../../utils/invariant';
import uiEventBus, { OAUTH2_AUTHORIZATION_STATUS_CHANGE } from '../../event-bus';
import { Modal, type ModalHandle } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalHeader } from '../base/modal-header';
import { Icon } from '../icon';

export const OAuthAuthorizationStatusModal: FC = () => {
  const { t } = useI18n();
  const [status, setStatus] = useState<OAuth2AuthorizationStatusType>('none');
  const [authCodeUrlStr, setAuthCodeUrlStr] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { submit: redirectToDefaultBrowserSubmit } = useDefaultBrowserRedirectActionFetcher();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = window.main.on('show-oauth-authorization-modal', (_, authCodeUrlStr: string) => {
      uiEventBus.emit(OAUTH2_AUTHORIZATION_STATUS_CHANGE, {
        status: 'getting_code',
        authCodeUrlStr,
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.main.on('hide-oauth-authorization-modal', _ => {
      uiEventBus.emit(OAUTH2_AUTHORIZATION_STATUS_CHANGE, {
        status: 'none',
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleStatusChange = ({
      status: newStatus,
      authCodeUrlStr,
    }: {
      status: OAuth2AuthorizationStatusType;
      authCodeUrlStr?: string;
    }) => {
      setStatus(newStatus);
      setAuthCodeUrlStr(authCodeUrlStr);
    };
    uiEventBus.on(OAUTH2_AUTHORIZATION_STATUS_CHANGE, handleStatusChange);
    return () => {
      uiEventBus.off(OAUTH2_AUTHORIZATION_STATUS_CHANGE, handleStatusChange);
    };
  }, []);

  const modalRef = useRef<ModalHandle>(null);
  useEffect(() => {
    modalRef.current?.show();
  }, []);

  useEffect(() => {
    if (status === 'none') {
      modalRef.current?.hide();
    } else if (status === 'getting_code') {
      modalRef.current?.show();
      setSubmitting(false);
      setError(null);
    }
  }, [status]);

  return (
    <Modal
      centered
      ref={modalRef}
      onHide={() => {
        setStatus('none');
        setSubmitting(false);
        window.main.cancelAuthorizationInDefaultBrowser('Canceled by user.');
      }}
    >
      <ModalHeader>{t('modals.oauthAuthorization')}</ModalHeader>
      <ModalBody>
        {status === 'none' && t('modals.notInAuthorization')}
        {status === 'getting_code' && (
          <>
            <p className="text-start text-[rgba(var(--color-font-rgb),0.8)]">
              {t('modals.finishAuthorizationInBrowser')}
            </p>
            <div className="form-control form-control--outlined no-pad-top flex">
              <input type="text" value={authCodeUrlStr} style={{ marginRight: 'var(--padding-sm)' }} readOnly />
              <button
                className="btn btn--super-compact btn--outlined"
                onClick={() => {
                  window.clipboard.writeText(authCodeUrlStr as string);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--padding-xs)',
                }}
              >
                <i className="fa fa-clipboard" aria-hidden="true" />
                {t('common.copy')}
              </button>
            </div>
            <p className="text-start text-[rgba(var(--color-font-rgb),0.8)]">
              {t('modals.copyRedirectUrlAfterAuthorization')}
            </p>
            <form
              onSubmit={e => {
                try {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);

                  const url = data.get('url');
                  invariant(typeof url === 'string', 'Expected code to be a string');
                  if (url.length === 0) {
                    return;
                  }
                  setError(null);
                  setSubmitting(true);
                  const parsedUrl = new URL(url);
                  const params = Object.fromEntries(parsedUrl.searchParams);
                  const { encryptedUrl: encryptedRedirectUrl, encryptedKey, iv } = params;
                  if (encryptedRedirectUrl && encryptedKey && iv) {
                    return redirectToDefaultBrowserSubmit({
                      encryptedRedirectUrl,
                      encryptedKey,
                      iv,
                    });
                  }
                  return redirectToDefaultBrowserSubmit({
                    redirectUrl: url,
                  });
                } catch (error) {
                  setError(error instanceof Error ? error.message : String(error));
                  setSubmitting(false);
                  return;
                }
              }}
            >
              <div className="form-control form-control--outlined no-pad-top" style={{ display: 'flex' }}>
                <input type="text" name="url" style={{ marginRight: 'var(--padding-sm)' }} />
                <button
                  className="btn btn--super-compact btn--outlined"
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--padding-xs)',
                  }}
                  disabled={submitting}
                >
                  <Icon icon={submitting ? 'spinner' : 'sign-in'} className={submitting ? 'animate-spin' : ''} />
                  {t('modals.proceed')}
                </button>
              </div>
              {error && (
                <p className="text-danger">
                  {t('common.error')}: {error}
                </p>
              )}
            </form>
          </>
        )}
        {status === 'getting_token' && t('modals.gettingAccessToken')}
      </ModalBody>
    </Modal>
  );
};

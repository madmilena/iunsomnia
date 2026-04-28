import { JSONPath } from 'jsonpath-plus';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import type { GrpcRequest, McpRequest, Request, SocketIORequest, WebSocketRequest } from '~/insomnia-data';
import { useI18n } from '~/ui/i18n';

import type { RenderError } from '../../../templating/render-error';
import { Modal, type ModalHandle, type ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalHeader } from '../base/modal-header';
export interface RequestRenderErrorModalOptions {
  error: RenderError | null;
  request: Request | WebSocketRequest | SocketIORequest | GrpcRequest | McpRequest | null;
}
export interface RequestRenderErrorModalHandle {
  show: (options: RequestRenderErrorModalOptions) => void;
  hide: () => void;
}

export const RequestRenderErrorModal = forwardRef<RequestRenderErrorModalHandle, ModalProps>((_, ref) => {
  const { t } = useI18n();
  const modalRef = useRef<ModalHandle>(null);
  const [state, setState] = useState<RequestRenderErrorModalOptions>({
    error: null,
    request: null,
  });
  const { request, error } = state;

  useImperativeHandle(
    ref,
    () => ({
      hide: () => {
        modalRef.current?.hide();
      },
      show: options => {
        setState(options);
        modalRef.current?.show();
      },
    }),
    [],
  );

  const fullPath = `Request.${error?.path}`;
  const result = JSONPath({ json: request, path: `$.${error?.path}` });
  const template = result && Array.isArray(result) && result.length ? result[0] : null;
  const locationLabel = template?.includes('\n')
    ? t('modals.lineOf', { line: error?.location.line || '' })
    : null;

  return (
    <Modal ref={modalRef}>
      <ModalHeader>{t('modals.failedToRenderRequest')}</ModalHeader>
      <ModalBody>
        {request && error ? (
          <div className="pad">
            <div className="notice warning">
              <p>
                {t('modals.failedToRenderPathBeforeSendingPrefix')} <strong>{fullPath}</strong>{' '}
                {t('modals.failedToRenderPathBeforeSendingSuffix')}
              </p>
            </div>

            <p>
              <strong>{t('modals.renderError')}</strong>
              <code className="selectable block">{error.message}</code>
            </p>

            <p>
              <strong>{t('modals.causedByFollowingField')}</strong>
              <code className="block">
                {locationLabel} {fullPath}
              </code>
            </p>
          </div>
        ) : null}
      </ModalBody>
    </Modal>
  );
});

RequestRenderErrorModal.displayName = 'RequestRenderErrorModal';

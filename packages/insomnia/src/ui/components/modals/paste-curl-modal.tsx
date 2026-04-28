import React, { useEffect, useRef, useState } from 'react';
import { OverlayContainer } from 'react-aria';

import type { Request } from '~/insomnia-data';
import { CodeEditor } from '~/ui/components/.client/codemirror/code-editor';
import { useI18n } from '~/ui/i18n';

import { Modal, type ModalHandle, type ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalFooter } from '../base/modal-footer';
import { ModalHeader } from '../base/modal-header';

export const PasteCurlModal = ({
  onHide,
  onImport,
  defaultValue,
}: ModalProps & { onImport: (req: Partial<Request>) => void; defaultValue?: string }) => {
  const { t } = useI18n();
  const modalRef = useRef<ModalHandle>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [req, setReq] = useState<any>({});

  useEffect(() => {
    async function parseCurlToRequest() {
      try {
        const { data } = await window.main.parseImport(
          {
            contentStr: defaultValue || '',
          },
          {
            importerId: 'curl',
          },
        );
        const { resources } = data;
        const importedRequest = resources[0];
        setIsValid(true);
        setReq(importedRequest);
      } catch (error) {
        console.log('[importer] error', error);
        setIsValid(false);
        setReq({});
      } finally {
        modalRef.current?.show();
      }
    }
    parseCurlToRequest();
  }, [defaultValue]);

  return (
    <OverlayContainer onClick={e => e.stopPropagation()}>
      <Modal ref={modalRef} tall onHide={onHide}>
        <ModalHeader>{t('modals.pasteCurlToImportRequest')}</ModalHeader>
        <ModalBody className="">
          <CodeEditor
            id="paste-curl-content"
            placeholder={t('modals.pasteCurlRequestHere')}
            className="border-top"
            mode="text"
            dynamicHeight
            defaultValue={defaultValue}
            onChange={async value => {
              if (!value) {
                setIsValid(false);
                setReq({});
                return;
              }
              try {
                const { data } = await window.main.parseImport(
                  {
                    contentStr: value,
                  },
                  {
                    importerId: 'curl',
                  },
                );
                const { resources } = data;
                const importedRequest = resources[0];
                setIsValid(true);
                setReq(importedRequest);
              } catch (error) {
                console.log('[importer] error', error);
                setIsValid(false);
                setReq({});
              }
            }}
          />
        </ModalBody>
        <ModalFooter>
          <div className="margin-left txt-sm truncate italic">
            {isValid
              ? t('modals.detectedRequestToUrl', { method: req.method, url: req.url })
              : t('modals.invalidInput')}
          </div>
          <div>
            <button className="btn" onClick={() => modalRef.current?.hide()}>
              {t('common.cancel')}
            </button>
            <button
              className="btn"
              onClick={() => {
                onImport(req);
                modalRef.current?.hide();
              }}
              disabled={!isValid}
            >
              {t('common.import')}
            </button>
          </div>
        </ModalFooter>
      </Modal>
    </OverlayContainer>
  );
};

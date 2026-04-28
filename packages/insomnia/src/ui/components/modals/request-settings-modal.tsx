import React, { useEffect, useRef, useState } from 'react';
import { OverlayContainer } from 'react-aria';
import { useNavigate, useParams } from 'react-router';

import type { GrpcRequest, McpRequest, Request, SocketIORequest, WebSocketRequest } from '~/insomnia-data';
import { services } from '~/insomnia-data';
import { useProjectListWorkspacesLoaderFetcher } from '~/routes/organization.$organizationId.project.$projectId.list-workspaces';
import { useRequestDuplicateActionFetcher } from '~/routes/organization.$organizationId.project.$projectId.workspace.$workspaceId.debug.request.$requestId.duplicate';
import { useReadyState } from '~/ui/hooks/use-ready-state';
import { useI18n } from '~/ui/i18n';

import { isNotNullOrUndefined } from '../../../common/misc';
import * as models from '../../../models';
import { isScratchpadOrganizationId } from '../../../models/organization';
import { revalidateWorkspaceActiveRequest } from '../../../routes/organization.$organizationId.project.$projectId.workspace.$workspaceId';
import { invariant } from '../../../utils/invariant';
import { useRequestPatcher } from '../../hooks/use-request';
import { Input } from '../base/input';
import { Modal, type ModalHandle, type ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalHeader } from '../base/modal-header';
import { HelpTooltip } from '../help-tooltip';
import { Icon } from '../icon';

const { isRequest } = models.request;

export interface RequestSettingsModalOptions {
  request: Request | GrpcRequest | WebSocketRequest | SocketIORequest | McpRequest;
}

export const SocketIOPathSettings = ({
  request,
  patchRequest,
}: {
  request: SocketIORequest;
  patchRequest: (id: string, patch: Partial<SocketIORequest>) => void;
}) => {
  const { t } = useI18n();
  const readyState = useReadyState({ requestId: request._id, protocol: 'socketIO' });
  return (
    <Input
      label={t('modals.socketIoHandshakePath')}
      description={t('modals.socketIoHandshakePathDescription')}
      placeholder="/custom-path/"
      name="settingPath"
      defaultValue={request.settingPath || ''}
      isDisabled={readyState}
      onChange={value => patchRequest(request._id, { settingPath: value })}
    />
  );
};

export const RequestSettingsModal = ({ request, onHide }: ModalProps & RequestSettingsModalOptions) => {
  const { t } = useI18n();
  const modalRef = useRef<ModalHandle>(null);
  const { organizationId, projectId, workspaceId } = useParams() as {
    organizationId: string;
    projectId: string;
    workspaceId: string;
  };
  const workspacesFetcher = useProjectListWorkspacesLoaderFetcher();
  useEffect(() => {
    const isIdleAndUninitialized = workspacesFetcher.state === 'idle' && !workspacesFetcher.data;
    if (isIdleAndUninitialized && !isScratchpadOrganizationId(organizationId)) {
      workspacesFetcher.load({
        organizationId,
        projectId,
      });
    }
  }, [organizationId, projectId, workspacesFetcher]);
  const projectLoaderData = workspacesFetcher?.data;
  const workspacesForActiveProject =
    projectLoaderData?.files
      .map(w => w.workspace)
      .filter(isNotNullOrUndefined)
      .filter(w => w.scope === 'collection' || w.scope === 'design') || [];
  const [workspaceToCopyTo, setWorkspaceToCopyTo] = useState('');
  useEffect(() => {
    modalRef.current?.show();
  }, []);

  const duplicateRequestFetcher = useRequestDuplicateActionFetcher();
  const patchRequest = useRequestPatcher();
  const navigate = useNavigate();
  const duplicateRequest = (r: Partial<Request>) => {
    duplicateRequestFetcher.submit({
      organizationId,
      projectId,
      workspaceId,
      requestId: request._id,
      name: r.name || request.name,
      parentId: r.parentId,
    });
  };
  async function handleMoveToWorkspace() {
    invariant(workspaceToCopyTo, 'Workspace ID is required');
    patchRequest(request._id, { parentId: workspaceToCopyTo });
    // if active request is moved, clear the active request in the workspace
    revalidateWorkspaceActiveRequest(request._id, workspaceId);
    modalRef.current?.hide();
    navigate(`/organization/${organizationId}/project/${projectId}/workspace/${workspaceToCopyTo}/debug`);
  }

  async function handleCopyToWorkspace() {
    invariant(workspaceToCopyTo, 'Workspace ID is required');
    duplicateRequest({ parentId: workspaceToCopyTo });
  }

  const toggleCheckBox = async (event: any) => {
    patchRequest(request._id, { [event.currentTarget.name]: event.currentTarget.checked ? true : false });
  };
  const updateReflectonApi = async (event: React.ChangeEvent<HTMLInputElement>) => {
    invariant(models.grpcRequest.isGrpcRequest(request), 'Must be gRPC request');
    patchRequest(request._id, {
      reflectionApi: {
        ...request.reflectionApi,
        [event.currentTarget.name]: event.currentTarget.value,
      },
    });
  };

  return (
    <OverlayContainer onContextMenu={e => e.stopPropagation()}>
        <Modal ref={modalRef} onHide={onHide}>
        <ModalHeader>
          {t('modals.requestSettings')} <span className="txt-sm selectable faint monospace">{request ? request._id : ''}</span>
        </ModalHeader>
        <ModalBody className="pad">
          <div>
            <div className="form-control form-control--outlined">
              <label>
                {t('common.name')} <span className="txt-sm faint italic">{t('modals.alsoRenameByDoubleClicking')}</span>
                <input
                  type="text"
                  placeholder={request?.url || t('modals.myRequest')}
                  defaultValue={request?.name}
                  onChange={event => patchRequest(request._id, { name: event.target.value })}
                />
              </label>
            </div>
            {request && models.webSocketRequest.isWebSocketRequest(request) && (
              <>
                <>
                  <div className="pad-top pad-bottom">
                    <div className="form-control form-control--thin">
                      <label>
                        {t('modals.sendCookiesAutomatically')}
                        <input
                          type="checkbox"
                          name="settingSendCookies"
                          checked={request.settingSendCookies}
                          onChange={toggleCheckBox}
                        />
                      </label>
                    </div>
                    <div className="form-control form-control--thin">
                      <label>
                        {t('modals.storeCookiesAutomatically')}
                        <input
                          type="checkbox"
                          name="settingStoreCookies"
                          checked={request.settingStoreCookies}
                          onChange={toggleCheckBox}
                        />
                      </label>
                    </div>
                    <div className="form-control form-control--thin">
                      <label>
                        {t('modals.useProxyFromPreferences')}
                        <input
                          type="checkbox"
                          name="settingUseProxy"
                          checked={request.settingUseProxy}
                          onChange={toggleCheckBox}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="form-control form-control--outlined">
                    <label>
                      {t('settings.followRedirects')} <span className="txt-sm faint italic">{t('modals.overridesGlobalSetting')}</span>
                      <select
                        defaultValue={request.settingFollowRedirects}
                        name="settingFollowRedirects"
                        onChange={toggleCheckBox}
                      >
                        <option value={'global'}>{t('modals.useGlobalSetting')}</option>
                        <option value={'off'}>{t('modals.dontFollowRedirects')}</option>
                        <option value={'on'}>{t('settings.followRedirects')}</option>
                      </select>
                    </label>
                  </div>
                </>
                <hr />
                <div className="form-row">
                  <div className="form-control form-control--outlined">
                    <label>
                      {t('modals.moveCopyToWorkspace')}
                      <HelpTooltip position="top" className="space-left">
                        {t('modals.moveCopyRequestToWorkspaceHelp')}
                      </HelpTooltip>
                      <select
                        value={workspaceToCopyTo}
                        onChange={event => {
                          setWorkspaceToCopyTo(event.currentTarget.value);
                        }}
                      >
                        <option value="">{t('modals.selectWorkspaceOption')}</option>
                        {workspacesForActiveProject.map(w => {
                          if (workspaceId === w._id) {
                            return null;
                          }

                          return (
                            <option key={w._id} value={w._id}>
                              {w.name}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  </div>
                  <div className="form-control form-control--no-label width-auto">
                    <button
                      disabled={!workspaceToCopyTo}
                      className="h-(--line-height-xs) rounded-md border border-solid border-(--hl-lg) px-(--padding-md) hover:bg-(--hl-xs)"
                      onClick={handleCopyToWorkspace}
                    >
                      {t('common.copy')}
                    </button>
                  </div>
                  <div className="form-control form-control--no-label width-auto">
                    <button
                      disabled={!workspaceToCopyTo}
                      className="h-(--line-height-xs) rounded-md border border-solid border-(--hl-lg) px-(--padding-md) hover:bg-(--hl-xs)"
                      onClick={handleMoveToWorkspace}
                    >
                      {t('common.move')}
                    </button>
                  </div>
                </div>
              </>
            )}
            {request && models.socketIORequest.isSocketIORequest(request) && (
              <SocketIOPathSettings request={request} patchRequest={patchRequest} />
            )}
            {request && models.grpcRequest.isGrpcRequest(request) && (
              <>
                <div className="form-control form-control--thin pad-top-sm">
                  <label>
                    {t('modals.useBufSchemaRegistryApi')}
                    <a href="https://buf.build/docs/bsr/reflection/overview" className="pad-left-sm">
                      <Icon icon="external-link" size="sm" />
                    </a>
                    <input
                      type="checkbox"
                      name="reflectionApi"
                      checked={request.reflectionApi.enabled}
                      onChange={event =>
                        patchRequest(request._id, {
                          reflectionApi: {
                            ...request.reflectionApi,
                            enabled: event.currentTarget.checked,
                          },
                        })
                      }
                    />
                    ̵
                  </label>
                </div>
                <div className="form-row pad-top-sm">
                  {request.reflectionApi.enabled && (
                    <>
                      <div className="form-control form-control--outlined">
                        <label>
                          {t('modals.reflectionServerUrl')}
                          <a href="https://buf.build/docs/bsr/api-access" className="pad-left-sm">
                            <Icon icon="external-link" size="sm" />
                          </a>
                          <input
                            type="text"
                            name="url"
                            placeholder="https://buf.build"
                            defaultValue={request.reflectionApi.url}
                            onBlur={updateReflectonApi}
                            disabled={!request.reflectionApi.enabled}
                          />
                        </label>
                      </div>
                      <div className="form-control form-control--outlined">
                        <label>
                          {t('modals.reflectionServerApiKey')}
                          <a href="https://buf.build/docs/bsr/authentication#manage-tokens" className="pad-left-sm">
                            <Icon icon="external-link" size="sm" />
                          </a>
                          <input
                            type="password"
                            name="apiKey"
                            defaultValue={request.reflectionApi.apiKey}
                            onBlur={updateReflectonApi}
                            disabled={!request.reflectionApi.enabled}
                          />
                        </label>
                      </div>
                      <div className="form-control form-control--outlined">
                        <label>
                          {t('modals.module')}
                          <a href="https://buf.build/docs/bsr/module/manage" className="pad-left-sm">
                            <Icon icon="external-link" size="sm" />
                          </a>
                          <input
                            type="text"
                            name="module"
                            placeholder="buf.build/connectrpc/eliza"
                            defaultValue={request.reflectionApi.module}
                            onBlur={updateReflectonApi}
                            disabled={!request.reflectionApi.enabled}
                          />
                        </label>
                      </div>
                    </>
                  )}
                </div>
                <p className="faint pad-top italic">
                  {t('modals.grpcSettingsFeatureRequestPrefix')}{' '}
                  <a href={'https://iusomnia.local/issues/new/choose'}>{t('modals.featureRequest')}</a>!
                </p>
              </>
            )}
            {request && isRequest(request) && (
              <>
                <>
                  <div className="pad-top pad-bottom">
                    <div className="form-control form-control--thin">
                      <label>
                        {t('modals.sendCookiesAutomatically')}
                        <input
                          type="checkbox"
                          name="settingSendCookies"
                          checked={request.settingSendCookies}
                          onChange={toggleCheckBox}
                        />
                      </label>
                    </div>
                    <div className="form-control form-control--thin">
                      <label>
                        {t('modals.storeCookiesAutomatically')}
                        <input
                          type="checkbox"
                          name="settingStoreCookies"
                          checked={request.settingStoreCookies}
                          onChange={toggleCheckBox}
                        />
                      </label>
                    </div>
                    <div className="form-control form-control--thin">
                      <label>
                        {t('modals.automaticallyEncodeSpecialCharactersInUrl')}
                        <input
                          type="checkbox"
                          name="settingEncodeUrl"
                          checked={request.settingEncodeUrl}
                          onChange={toggleCheckBox}
                        />
                        <HelpTooltip position="top" className="space-left">
                          {t('modals.automaticallyEncodeSpecialCharactersInUrlHelp')}
                        </HelpTooltip>
                      </label>
                    </div>
                    <div className="form-control form-control--thin">
                      <label>
                        {t('modals.skipRenderingOfRequestBody')}
                        <input
                          type="checkbox"
                          name="settingDisableRenderRequestBody"
                          checked={request.settingDisableRenderRequestBody}
                          onChange={toggleCheckBox}
                        />
                        <HelpTooltip position="top" className="space-left">
                          {t('modals.skipRenderingOfRequestBodyHelp')}
                        </HelpTooltip>
                      </label>
                    </div>
                    <div className="form-control form-control--thin">
                      <label>
                        {t('modals.rebuildPathDotSequences')}
                        <HelpTooltip position="top" className="space-left">
                          {t('modals.rebuildPathDotSequencesHelp')}
                        </HelpTooltip>
                        <input
                          type="checkbox"
                          name="settingRebuildPath"
                          checked={request['settingRebuildPath']}
                          onChange={toggleCheckBox}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="form-control form-control--outlined">
                    <label>
                      {t('settings.followRedirects')} <span className="txt-sm faint italic">{t('modals.overridesGlobalSetting')}</span>
                      <select
                        defaultValue={request.settingFollowRedirects}
                        name="settingFollowRedirects"
                        onChange={async event => {
                          await services.request.update(request, {
                            [event.currentTarget.name]: event.currentTarget.value,
                          });
                        }}
                      >
                        <option value={'global'}>{t('modals.useGlobalSetting')}</option>
                        <option value={'off'}>{t('modals.dontFollowRedirects')}</option>
                        <option value={'on'}>{t('settings.followRedirects')}</option>
                      </select>
                    </label>
                  </div>
                </>
                <hr />
                <div className="form-row">
                  <div className="form-control form-control--outlined">
                    <label>
                      {t('modals.moveCopyToWorkspace')}
                      <HelpTooltip position="top" className="space-left">
                        {t('modals.moveCopyRequestToWorkspaceHelp')}
                      </HelpTooltip>
                      <select
                        value={workspaceToCopyTo}
                        onChange={event => {
                          setWorkspaceToCopyTo(event.currentTarget.value);
                        }}
                      >
                        <option value="">{t('modals.selectWorkspaceOption')}</option>
                        {workspacesForActiveProject.map(w => {
                          if (workspaceId === w._id) {
                            return null;
                          }

                          return (
                            <option key={w._id} value={w._id}>
                              {w.name}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  </div>
                  <div className="form-control form-control--no-label width-auto">
                    <button
                      disabled={!workspaceToCopyTo}
                      className="h-(--line-height-xs) rounded-md border border-solid border-(--hl-lg) px-(--padding-md) hover:bg-(--hl-xs)"
                      onClick={handleCopyToWorkspace}
                    >
                      {t('common.copy')}
                    </button>
                  </div>
                  <div className="form-control form-control--no-label width-auto">
                    <button
                      disabled={!workspaceToCopyTo}
                      className="h-(--line-height-xs) rounded-md border border-solid border-(--hl-lg) px-(--padding-md) hover:bg-(--hl-xs)"
                      onClick={handleMoveToWorkspace}
                    >
                      {t('common.move')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </ModalBody>
      </Modal>
    </OverlayContainer>
  );
};

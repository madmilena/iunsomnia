import React, { type FC, Fragment } from 'react';

import { useRootLoaderData } from '~/root';
import { useI18n } from '~/ui/i18n';
import { clearOAuthWindowSessionId } from '~/ui/spawn-oauth-window';

import {
  EditorKeyMap,
  MAX_EDITOR_FONT_SIZE,
  MAX_INTERFACE_FONT_SIZE,
  MIN_EDITOR_FONT_SIZE,
  MIN_INTERFACE_FONT_SIZE,
} from '../../../common/constants';
import { docsKeyMaps } from '../../../common/documentation';
import { isMac } from '../../../common/platform';
import { type HttpVersion, HttpVersions, type Language } from '../../../common/settings';
import { Link } from '../base/link';
import { BooleanSetting } from './boolean-setting';
import { EnumSetting } from './enum-setting';
import { NumberSetting } from './number-setting';
import { TextArraySetting } from './text-array-setting';
import { TextSetting } from './text-setting';
import { VaultKeyPanel } from './vault-key-panel';

export const General: FC = () => {
  const { settings, userSession } = useRootLoaderData()!;
  const isLoggedIn = Boolean(userSession.id);
  const { t, setLanguage } = useI18n();

  return (
    <div className="relative p-4">
      <h2 className="sticky top-0 left-0 z-10 bg-(--color-bg) pt-2 pb-2 text-lg font-bold">{t('settings.general')}</h2>

      <div className="">
        <div>
          <EnumSetting<Language>
            label={t('settings.language')}
            setting="language"
            help={t('settings.languageHelp')}
            values={[
              { value: 'en', name: 'English' },
              { value: 'pt-BR', name: 'Português (Brasil)' },
            ]}
            onChange={setLanguage}
          />
          <BooleanSetting label={t('settings.useBulkHeaderEditor')} setting="useBulkHeaderEditor" />
          <BooleanSetting
            label={t('settings.useVerticalLayout')}
            setting="forceVerticalLayout"
            help={t('settings.useVerticalLayoutHelp')}
          />
          <BooleanSetting
            label={t('settings.showVariableSourceAndValue')}
            help={t('settings.showVariableSourceAndValueHelp')}
            setting="showVariableSourceAndValue"
          />
        </div>
        <div>
          <BooleanSetting label={t('settings.revealPasswords')} setting="showPasswords" />
          {!isMac && <BooleanSetting label={t('settings.hideMenuBar')} setting="autoHideMenuBar" />}
          <BooleanSetting label={t('settings.rawTemplateSyntax')} setting="nunjucksPowerUserMode" />
        </div>
      </div>

      <div className="row-fill row-fill--top pad-top-sm">
        <NumberSetting
          label={t('settings.autoCompleteDelay')}
          setting="autocompleteDelay"
          help={t('settings.autoCompleteDelayHelp')}
          min={0}
          max={3000}
          step={100}
        />
      </div>

      <h2 className="sticky top-0 left-0 z-10 bg-(--color-bg) pt-5 pb-2 text-lg font-bold">{t('settings.font')}</h2>

      <div className="row-fill row-fill--top">
        <div>
          <BooleanSetting label={t('settings.indentWithTabs')} setting="editorIndentWithTabs" />
          <BooleanSetting label={t('settings.wrapTextEditorLines')} setting="editorLineWrapping" />
        </div>
        <div>
          <BooleanSetting label={t('settings.fontLigatures')} setting="fontVariantLigatures" />
        </div>
      </div>

      <div className="form-row pad-top-sm">
        <div className="form-row">
          <TextSetting
            label={t('settings.interfaceFont')}
            setting="fontInterface"
            help={t('settings.interfaceFontHelp')}
            placeholder={t('settings.interfaceFontPlaceholder')}
          />
          <NumberSetting
            label={t('settings.fontSize')}
            setting="fontSize"
            min={MIN_INTERFACE_FONT_SIZE}
            max={MAX_INTERFACE_FONT_SIZE}
          />
        </div>
      </div>

      <div className="form-row">
        <TextSetting
          label={t('settings.textEditorFont')}
          setting="fontMonospace"
          help={t('settings.textEditorFontHelp')}
          placeholder={t('settings.interfaceFontPlaceholder')}
        />
        <NumberSetting
          label={t('settings.editorFontSize')}
          setting="editorFontSize"
          min={MIN_EDITOR_FONT_SIZE}
          max={MAX_EDITOR_FONT_SIZE}
        />
      </div>

      <div className="form-row">
        <NumberSetting label={t('settings.editorIndentSize')} setting="editorIndentSize" help="" min={1} max={16} />

        <EnumSetting<EditorKeyMap>
          label={t('settings.textEditorKeyMap')}
          setting="editorKeyMap"
          help={
            isMac &&
            settings.editorKeyMap === EditorKeyMap.vim && (
              <Fragment>
                {t('settings.textEditorKeyMapVimHelp')}{' '}
                <Link href={docsKeyMaps}>
                  {t('settings.vimDocumentation')} <i className="fa fa-external-link-square" />
                </Link>
              </Fragment>
            )
          }
          values={[
            { value: EditorKeyMap.default, name: t('settings.textEditorKeyMapDefault') },
            { value: EditorKeyMap.vim, name: t('settings.textEditorKeyMapVim') },
            { value: EditorKeyMap.emacs, name: t('settings.textEditorKeyMapEmacs') },
            { value: EditorKeyMap.sublime, name: t('settings.textEditorKeyMapSublime') },
          ]}
        />
      </div>
      <div className="form-row">
        <BooleanSetting
          label={t('settings.enableKeyMapForInlineTextEditors')}
          setting="enableKeyMapForInlineTextEditors"
        />
      </div>

      <h2 className="sticky top-0 left-0 z-10 bg-(--color-bg) pt-5 pb-2 text-lg font-bold">{t('settings.requestResponse')}</h2>

      <div className="row-fill row-fill--top">
        <div>
          <BooleanSetting
            label={t('settings.validateSSL')}
            setting="validateSSL"
            help={t('settings.validateSSLHelp')}
          />
          <BooleanSetting label={t('settings.followRedirects')} setting="followRedirects" />
          <BooleanSetting
            label={t('settings.filterResponsesByEnvironment')}
            setting="filterResponsesByEnv"
            help={t('settings.filterResponsesByEnvironmentHelp')}
          />
        </div>
        <div>
          <BooleanSetting label={t('settings.disableJsInHtmlPreview')} setting="disableHtmlPreviewJs" />
          <BooleanSetting label={t('settings.disableLinksInResponseViewer')} setting="disableResponsePreviewLinks" />

          <BooleanSetting
            label={t('settings.disableDefaultUserAgentOnNewRequests')}
            setting="disableAppVersionUserAgent"
            help={t('settings.disableDefaultUserAgentOnNewRequestsHelp')}
          />
        </div>
      </div>

      <div className="form-row pad-top-sm">
        <EnumSetting<HttpVersion>
          label={t('settings.preferredHttpVersion')}
          setting="preferredHttpVersion"
          values={[
            { value: HttpVersions.default, name: t('settings.httpVersionDefault') },
            { value: HttpVersions.V1_0, name: t('settings.httpVersion1_0') },
            { value: HttpVersions.V1_1, name: t('settings.httpVersion1_1') },
            { value: HttpVersions.V2PriorKnowledge, name: t('settings.httpVersion2PriorKnowledge') },
            { value: HttpVersions.V2_0, name: t('settings.httpVersion2') },
            // Enable when our version of libcurl supports HTTP/3
            // see: https://github.com/JCMais/node-libcurl/issues/233
            // { value: HttpVersions.v3, name: 'HTTP/3' },
          ]}
          help={t('settings.preferredHttpVersionHelp')}
        />
      </div>

      <div className="form-row pad-top-sm">
        <NumberSetting
          label={t('settings.maxRedirects')}
          setting="maxRedirects"
          help={t('settings.maxRedirectsHelp')}
          min={-1}
        />
        <NumberSetting
          label={t('settings.timeout')}
          setting="timeout"
          help={t('settings.timeoutHelp')}
          min={0}
          step={100}
        />
      </div>

      <div className="form-row pad-top-sm">
        <NumberSetting
          label={t('settings.responseHistoryLimit')}
          setting="maxHistoryResponses"
          help={t('settings.responseHistoryLimitHelp')}
          min={-1}
        />
        <NumberSetting
          label={t('settings.maxTimelineChunkSize')}
          setting="maxTimelineDataSizeKB"
          help={t('settings.maxTimelineChunkSizeHelp')}
          min={0}
        />
      </div>

      <h2 className="sticky top-0 left-0 z-10 bg-(--color-bg) pt-5 pb-2 text-lg font-bold">{t('settings.security')}</h2>
      <div className="form-row pad-top-sm">
        <BooleanSetting
          label={t('settings.clearOAuth2SessionOnStart')}
          setting="clearOAuth2SessionOnRestart"
          help={t('settings.clearOAuth2SessionOnStartHelp')}
        />
        <button
          className="pointer h-(--line-height-xs) rounded-md border border-solid border-(--hl-lg) px-(--padding-sm) hover:bg-(--hl-xs)"
          onClick={clearOAuthWindowSessionId}
        >
          {t('settings.clearOAuth2Session')}
        </button>
      </div>
      <div className="form-row pad-top-sm">
        <BooleanSetting
          label={t('settings.validateCertificatesDuringAuthentication')}
          setting="validateAuthSSL"
          help={t('settings.validateCertificatesDuringAuthenticationHelp')}
        />
      </div>
      {isLoggedIn && <VaultKeyPanel />}

      <div className="form-row pad-top-sm">
        <TextArraySetting
          label={t('settings.whatFoldersCanIusomniaAccess')}
          setting="dataFolders"
          help={t('settings.whatFoldersCanIusomniaAccessHelp')}
          placeholder={t('settings.whatFoldersCanIusomniaAccessPlaceholder')}
        />
      </div>

      <h2 className="sticky top-0 left-0 z-10 bg-(--color-bg) pt-5 pb-2 text-lg font-bold">{t('settings.plugins')}</h2>
      <TextSetting
        label={t('settings.additionalPluginPath')}
        setting="pluginPath"
        help={t('settings.additionalPluginPathHelp')}
        placeholder={t('settings.additionalPluginPathPlaceholder')}
      />

    </div>
  );
};

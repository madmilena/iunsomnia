import React, { type FC } from 'react';
import { Button } from 'react-aria-components';

import { useRootLoaderData } from '~/root';
import { type TranslationKey, useI18n } from '~/ui/i18n';

import {
  areSameKeyCombinations,
  constructKeyCombinationDisplay,
  getPlatformKeyCombinations,
  newDefaultRegistry,
} from '../../../common/hotkeys';
import { generateId } from '../../../common/misc';
import type { HotKeyRegistry, KeyboardShortcut, KeyCombination } from '../../../common/settings';
import { useSettingsPatcher } from '../../hooks/use-request';
import { Dropdown, DropdownItem, DropdownSection, ItemContent } from '../base/dropdown';
import { PromptButton } from '../base/prompt-button';
import { Hotkey } from '../hotkey';
import { showModal } from '../modals';
import { AddKeyCombinationModal } from '../modals/add-key-combination-modal';

const keyboardShortcutDescriptionTranslationKeys: Record<KeyboardShortcut, TranslationKey> = {
  workspace_showSettings: 'settings.shortcuts.descriptions.workspaceShowSettings',
  request_showSettings: 'settings.shortcuts.descriptions.requestShowSettings',
  preferences_showKeyboardShortcuts: 'settings.shortcuts.descriptions.preferencesShowKeyboardShortcuts',
  preferences_showGeneral: 'settings.shortcuts.descriptions.preferencesShowGeneral',
  request_quickSwitch: 'settings.shortcuts.descriptions.requestQuickSwitch',
  plugin_reload: 'settings.shortcuts.descriptions.pluginReload',
  showAutocomplete: 'settings.shortcuts.descriptions.showAutocomplete',
  request_send: 'settings.shortcuts.descriptions.requestSend',
  request_showOptions: 'settings.shortcuts.descriptions.requestShowOptions',
  environment_showEditor: 'settings.shortcuts.descriptions.environmentShowEditor',
  environment_showSwitchMenu: 'settings.shortcuts.descriptions.environmentShowSwitchMenu',
  request_toggleHttpMethodMenu: 'settings.shortcuts.descriptions.requestToggleHttpMethodMenu',
  request_toggleHistory: 'settings.shortcuts.descriptions.requestToggleHistory',
  request_focusUrl: 'settings.shortcuts.descriptions.requestFocusUrl',
  request_showGenerateCodeEditor: 'settings.shortcuts.descriptions.requestShowGenerateCodeEditor',
  sidebar_focusFilter: 'settings.shortcuts.descriptions.sidebarFocusFilter',
  sidebar_toggle: 'settings.shortcuts.descriptions.sidebarToggle',
  response_focus: 'settings.shortcuts.descriptions.responseFocus',
  showCookiesEditor: 'settings.shortcuts.descriptions.showCookiesEditor',
  request_createHTTP: 'settings.shortcuts.descriptions.requestCreateHTTP',
  request_showDelete: 'settings.shortcuts.descriptions.requestShowDelete',
  request_showCreateFolder: 'settings.shortcuts.descriptions.requestShowCreateFolder',
  request_showDuplicate: 'settings.shortcuts.descriptions.requestShowDuplicate',
  request_togglePin: 'settings.shortcuts.descriptions.requestTogglePin',
  environment_showVariableSourceAndValue: 'settings.shortcuts.descriptions.environmentShowVariableSourceAndValue',
  beautifyRequestBody: 'settings.shortcuts.descriptions.beautifyRequestBody',
  graphql_explorer_focus_filter: 'settings.shortcuts.descriptions.graphqlExplorerFocusFilter',
  close_tab: 'settings.shortcuts.descriptions.closeTab',
  tab_nextTab: 'settings.shortcuts.descriptions.tabNextTab',
  tab_previousTab: 'settings.shortcuts.descriptions.tabPreviousTab',
  tab_reopenClosedTab: 'settings.shortcuts.descriptions.tabReopenClosedTab',
  request_openInNewTab: 'settings.shortcuts.descriptions.requestOpenInNewTab',
};

export const isKeyCombinationInRegistry = (
  pressedKeyComb: KeyCombination,
  hotKeyRegistry: Partial<HotKeyRegistry>,
): boolean =>
  !!Object.values(hotKeyRegistry).find(bindings =>
    getPlatformKeyCombinations(bindings).find(keyComb => areSameKeyCombinations(pressedKeyComb, keyComb)),
  );

export const Shortcuts: FC = () => {
  const { settings } = useRootLoaderData()!;
  const { hotKeyRegistry } = settings;
  const patchSettings = useSettingsPatcher();
  const { t } = useI18n();

  return (
    <div className="shortcuts">
      <div className="row-spaced margin-bottom-xs">
        <div>
          <PromptButton
            className="btn btn--clicky"
            onClick={() => patchSettings({ hotKeyRegistry: newDefaultRegistry() })}
          >
            {t('settings.shortcuts.resetAll')}
          </PromptButton>
        </div>
      </div>
      <table className="table--fancy">
        <tbody>
          {Object.entries(hotKeyRegistry).map(([key, platformCombinations]) => {
            const keyboardShortcut = key as KeyboardShortcut;
            // smelly
            const keyCombosForThisPlatform = getPlatformKeyCombinations(platformCombinations).map(k => ({
              ...k,
              id: generateId('key'),
            }));

            return (
              <tr key={keyboardShortcut}>
                <td style={{ verticalAlign: 'middle' }}>
                  {t(keyboardShortcutDescriptionTranslationKeys[keyboardShortcut])}
                </td>
                <td className="text-right">
                  {keyCombosForThisPlatform.map(keyComb => {
                    return (
                      <code key={keyComb.id} className="margin-left-sm" style={{ lineHeight: '1.25em' }}>
                        <Hotkey keyCombination={keyComb} />
                      </code>
                    );
                  })}
                </td>
                <td className="options text-right" style={{ verticalAlign: 'middle' }}>
                  <Dropdown
                    aria-label={t('settings.shortcuts.selectMode')}
                    closeOnSelect={false}
                    triggerButton={
                      <Button>
                        <i className="fa fa-gear" />
                      </Button>
                    }
                  >
                    <DropdownItem aria-label={t('settings.shortcuts.addKeyboardShortcut')}>
                      <ItemContent
                        icon="plus-circle"
                        label={t('settings.shortcuts.addKeyboardShortcut')}
                        onClick={() =>
                          showModal(AddKeyCombinationModal, {
                            keyboardShortcut,
                            checkKeyCombinationDuplicate: (pressed: KeyCombination) =>
                              isKeyCombinationInRegistry(pressed, hotKeyRegistry),
                            addKeyCombination: (keyboardShortcut: KeyboardShortcut, keyComb: KeyCombination) => {
                              const keyCombs = getPlatformKeyCombinations(hotKeyRegistry[keyboardShortcut]);
                              keyCombs.push(keyComb);
                              patchSettings({ hotKeyRegistry });
                            },
                          })
                        }
                      />
                    </DropdownItem>
                    <DropdownSection
                      aria-label={t('settings.shortcuts.removeExistingSection')}
                      title={t('settings.shortcuts.removeExisting')}
                    >
                      {
                        /* Dropdown items to remove key combinations. */
                        keyCombosForThisPlatform.map((keyComb: KeyCombination) => {
                          const display = constructKeyCombinationDisplay(keyComb, false);
                          return (
                            <DropdownItem key={display} aria-label={display}>
                              <ItemContent
                                icon="trash-o"
                                label={display}
                                withPrompt
                                onClick={() => {
                                  let toBeRemovedIndex = -1;
                                  const keyCombs = getPlatformKeyCombinations(hotKeyRegistry[keyboardShortcut]);
                                  keyCombs.forEach((existingKeyComb, index) => {
                                    if (areSameKeyCombinations(existingKeyComb, keyComb)) {
                                      toBeRemovedIndex = index;
                                    }
                                  });
                                  if (toBeRemovedIndex >= 0) {
                                    keyCombs.splice(toBeRemovedIndex, 1);

                                    patchSettings({ hotKeyRegistry });
                                  }
                                }}
                              />
                            </DropdownItem>
                          );
                        })
                      }
                    </DropdownSection>

                    <DropdownSection aria-label={t('settings.shortcuts.resetKeyboardShortcutsSection')}>
                      <DropdownItem aria-label={t('settings.shortcuts.resetKeyboardShortcuts')}>
                        <ItemContent
                          icon="empty"
                          label={t('settings.shortcuts.resetKeyboardShortcuts')}
                          withPrompt
                          onClick={() => {
                            hotKeyRegistry[keyboardShortcut] = newDefaultRegistry()[keyboardShortcut];
                            patchSettings({ hotKeyRegistry });
                          }}
                        />
                      </DropdownItem>
                    </DropdownSection>
                  </Dropdown>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

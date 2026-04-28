import React, { useCallback, useEffect, useState } from 'react';
import { Button } from 'react-aria-components';
import * as reactUse from 'react-use';

import { getProductName } from '~/common/constants';
import { useRootLoaderData } from '~/root';
import { useCreateVaultKeyFetcher } from '~/routes/auth.create-vault-key';
import { useUpdateVaultSaltFetcher } from '~/routes/auth.update-vault-salt';
import { CopyButton } from '~/ui/components/base/copy-button';
import { HelpTooltip } from '~/ui/components/help-tooltip';
import { Icon } from '~/ui/components/icon';
import { showError, showModal } from '~/ui/components/modals';
import { AskModal } from '~/ui/components/modals/ask-modal';
import { InputVaultKeyModal } from '~/ui/components/modals/input-vault-key-modal';
import { useI18n } from '~/ui/i18n';
import { decryptVaultKeyFromSession, deleteVaultKeyFromStorage, saveVaultKeyIfNecessary } from '~/utils/vault';

import { BooleanSetting } from './boolean-setting';

export const VaultKeyDisplayInput = ({ vaultKey }: { vaultKey: string }) => {
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const { t } = useI18n();

  reactUse.useInterval(() => {
    setShowCopyConfirmation(false);
  }, 2000);

  const donwloadVaultKey = async () => {
    const { canceled, filePath: outputPath } = await window.dialog.showSaveDialog({
      title: t('settings.vault.downloadVaultKey'),
      buttonLabel: t('common.save'),
      defaultPath: `${getProductName()}-vault-key-${Date.now()}.txt`,
    });

    if (canceled || !outputPath) {
      return;
    }

    await window.main.writeFile({
      path: outputPath,
      content: vaultKey,
    });
  };

  return (
    <div className="flex w-full items-center gap-3 border border-solid border-(--hl-sm) bg-(--hl-xs) px-2 py-1">
      <div
        className="w-[calc(100%-50px)] truncate"
        data-testid="VaultKeyDisplayPanel"
        onDoubleClick={(event: React.MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          if (vaultKey) {
            window.clipboard.writeText(vaultKey);
          }
          setShowCopyConfirmation(true);
        }}
      >
        {vaultKey}
      </div>
      <CopyButton
        size="small"
        content={vaultKey}
        title={t('settings.vault.copyVaultKey')}
        showConfirmation={showCopyConfirmation}
        style={{ borderWidth: 0 }}
      >
        <i className="fa fa-copy" />
      </CopyButton>
      <Button onPress={donwloadVaultKey}>
        <i className="fa-solid fa-download" />
      </Button>
    </div>
  );
};

export const VaultKeyPanel = () => {
  const { userSession, settings } = useRootLoaderData()!;
  const { t } = useI18n();
  const { saveVaultKeyLocally } = settings;
  const [isGenerating, setGenerating] = useState(false);
  const [vaultKeyValue, setVaultKeyValue] = useState('');
  const [showInputVaultKeyModal, setShowModal] = useState(false);
  const { accountId, vaultKey, vaultSalt } = userSession;
  const createVaultKeyFetcher = useCreateVaultKeyFetcher();
  const updateVaultSaltFetcher = useUpdateVaultSaltFetcher();
  const vaultSaltExists = typeof vaultSalt === 'string' && vaultSalt.length > 0;
  const vaultKeyExists = typeof vaultKey === 'string' && vaultKey.length > 0;

  const showVaultKey = useCallback(async () => {
    if (vaultKey) {
      // decrypt vault key saved in user session
      const decryptedVaultKey = await decryptVaultKeyFromSession(vaultKey, false);
      setVaultKeyValue(decryptedVaultKey);
    }
  }, [vaultKey]);

  useEffect(() => {
    if (vaultKeyExists) {
      showVaultKey();
    }
  }, [showVaultKey, vaultKeyExists]);

  useEffect(() => {
    if (createVaultKeyFetcher.data && !createVaultKeyFetcher.data.error && createVaultKeyFetcher.state === 'idle') {
      setGenerating(false);
      setVaultKeyValue(createVaultKeyFetcher.data.key || '');
    }
  }, [createVaultKeyFetcher.data, createVaultKeyFetcher.state]);

  useEffect(() => {
    if (createVaultKeyFetcher.data && createVaultKeyFetcher.data.error && createVaultKeyFetcher.state === 'idle') {
      setGenerating(false);
      // user has created vault key in another device;
      if (createVaultKeyFetcher.data.error.toLowerCase().includes('conflict')) {
        // get vault salt from server
        updateVaultSaltFetcher.submit();
        showModal(AskModal, {
          title: t('settings.vault.vaultKeyAlreadyExists'),
          message: t('settings.vault.vaultKeyAlreadyExistsMessage'),
          yesText: t('common.ok'),
          noText: t('common.cancel'),
        });
      } else {
        showError({
          title: t('settings.vault.cannotGenerateVaultKey'),
          message: createVaultKeyFetcher.data.error,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- vaultSaltFetcher should only be triggered once
  }, [createVaultKeyFetcher.data, createVaultKeyFetcher.state]);

  const generateVaultKey = async () => {
    setGenerating(true);
    createVaultKeyFetcher.submit();
  };

  const handleModalClose = (newVaultKey?: string) => {
    if (newVaultKey) {
      setVaultKeyValue(newVaultKey);
    }
    setShowModal(false);
  };

  useEffect(() => {
    // save or delete vault key to keychain
    if (saveVaultKeyLocally) {
      if (vaultKeyValue.length > 0) {
        saveVaultKeyIfNecessary(accountId, vaultKeyValue);
      }
    } else {
      deleteVaultKeyFromStorage(accountId);
    }
  }, [saveVaultKeyLocally, accountId, vaultKeyValue]);

  return (
    <div>
      {/* Show Gen Vault button when vault salt does not exist */}
      {!vaultSaltExists && (
        <div className="form-row pad-top-sm justify-start">
          <Button
            className={`btn btn--outlined btn--super-compact flex items-center ${isGenerating ? 'w-56' : 'w-48'}`}
            onPress={generateVaultKey}
            isDisabled={isGenerating}
            aria-label={t('settings.vault.generateVaultKey')}
          >
            {isGenerating && (
              <Icon icon="spinner" className="m-auto mr-2 inline-block animate-spin text-(--color-font)" />
            )}
            {t('settings.vault.generateVaultKey')}
            <HelpTooltip className="space-left">
              {t('settings.vault.generateVaultKeyHelp')}
            </HelpTooltip>
          </Button>
        </div>
      )}
      {vaultSaltExists && vaultKeyExists && vaultKeyValue !== '' && (
        <>
          <div className="form-row pad-top-sm flex-col">
            <div className="mb-(--padding-xs)">
              <span className="font-semibold">{t('settings.vault.vaultKey')}</span>
              <HelpTooltip className="space-left">{t('settings.vault.vaultKeyHelp')}</HelpTooltip>
            </div>
            <VaultKeyDisplayInput vaultKey={vaultKeyValue} />
          </div>
          <div className="form-row pad-top-sm">
            <BooleanSetting
              label={t('settings.vault.saveEncryptedVaultKeyLocally')}
              setting="saveVaultKeyLocally"
              confirmMessage={isChecked =>
                isChecked
                  ? t('settings.vault.saveVaultKeyLocallyConfirm')
                  : t('settings.vault.removeLocalVaultKeyConfirm')
              }
              confirmBeforeToggle
            />
          </div>
          <div className="form-row pad-top-sm">
            <BooleanSetting
              label={t('settings.vault.enableVaultInScripts')}
              help={t('settings.vault.enableVaultInScriptsHelp')}
              setting="enableVaultInScripts"
            />
          </div>
        </>
      )}
      {/* User has not input vault key after re-login */}
      {vaultSaltExists && !vaultKeyExists && (
        <div className="form-row pad-top-sm justify-start">
          <Button
            className="btn btn--outlined btn--super-compact flex w-48 items-center"
            onPress={() => setShowModal(true)}
          >
            {t('settings.vault.enterVaultKey')}
            <HelpTooltip className="space-left">{t('settings.vault.enterVaultKeyHelp')}</HelpTooltip>
          </Button>
        </div>
      )}
      {showInputVaultKeyModal && <InputVaultKeyModal onClose={handleModalClose} />}
    </div>
  );
};

import { useState } from 'react';
import { Button } from 'react-aria-components';

import { validatePat } from '~/konnect/api';
import { useRootLoaderData } from '~/root';
import { SegmentEvent } from '~/ui/analytics';
import { useI18n } from '~/ui/i18n';

import { useSettingsPatcher } from '../../hooks/use-request';

export const KonnectSettings = () => {
  const { settings } = useRootLoaderData()!;
  const patchSettings = useSettingsPatcher();
  const { t } = useI18n();

  const [pat, setPat] = useState('');
  const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleValidate = async () => {
    const trimmed = pat.trim();
    if (!trimmed) {
      return;
    }
    setStatus('validating');
    setValidationError(null);
    const result = await validatePat(trimmed);
    setStatus(result.valid ? 'valid' : 'invalid');
    if (result.valid) {
      await window.main.secretStorage.setSecret('konnectPat', trimmed);
      patchSettings({ hasKonnectPat: true });
      setPat('');
      window.main.trackSegmentEvent({ event: SegmentEvent.kongKonnectPatValidated });
    } else {
      setValidationError(result.error ?? t('settings.konnect.invalidPatOrConnection'));
    }
  };

  const handleClear = async () => {
    await window.main.secretStorage.deleteSecret('konnectPat');
    patchSettings({ hasKonnectPat: false });
    setPat('');
    setStatus('idle');
  };

  return (
    <div className="p-4">
      <h2 className="sticky top-0 left-0 z-10 bg-(--color-bg) pt-2 pb-2 text-lg font-bold">Iusomnia Konnect</h2>
      <p className="mb-4 text-sm text-(--hl)">
        {t('settings.konnect.description')}{' '}
        <a
          className="underline"
          href="https://cloud.iusomnia.local/global/account/tokens"
          onClick={e => {
            e.preventDefault();
            window.main.openInBrowser('https://cloud.iusomnia.local/global/account/tokens');
          }}
        >
          https://cloud.iusomnia.local/global/account/tokens
        </a>
        .
      </p>

      <div className="mb-4 flex flex-col gap-2">
        <label className="text-sm font-semibold" htmlFor="konnect-pat">
          {t('settings.konnect.personalAccessToken')}
        </label>
        {settings.hasKonnectPat ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-(--hl)">kpat_••••••••</span>
            <span className="text-xs text-(--color-success)">{t('common.saved')}</span>
          </div>
        ) : null}
        <input
          id="konnect-pat"
          type="password"
          className="rounded-xs border border-solid border-(--hl-sm) bg-(--color-bg) px-2 py-1 text-(--color-font) focus:ring-1 focus:ring-(--hl-md) focus:outline-hidden"
          placeholder={settings.hasKonnectPat ? t('settings.konnect.replacePatPlaceholder') : 'kpat_...'}
          value={pat}
          onChange={e => {
            setPat(e.target.value);
            setStatus('idle');
            setValidationError(null);
          }}
          autoComplete="off"
        />
        {status === 'valid' && <p className="text-xs text-(--color-success)">{t('settings.konnect.patValidSaved')}</p>}
        {status === 'invalid' && <p className="text-xs text-(--color-danger)">{validationError}</p>}
      </div>

      <div className="flex gap-2">
        <Button
          className="rounded-xs bg-(--color-surprise) px-3 py-1 text-sm text-white hover:opacity-90 disabled:opacity-50"
          isDisabled={!pat.trim() || status === 'validating'}
          onPress={handleValidate}
        >
          {status === 'validating' ? t('settings.konnect.validating') : t('settings.konnect.validateAndSave')}
        </Button>
        {settings.hasKonnectPat && (
          <Button
            className="rounded-xs border border-solid border-(--hl-sm) px-3 py-1 text-sm text-(--color-font) hover:bg-(--hl-xs)"
            onPress={handleClear}
          >
            {t('common.clear')}
          </Button>
        )}
      </div>
    </div>
  );
};

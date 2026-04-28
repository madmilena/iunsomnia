import React, { type PropsWithChildren, type ReactNode } from 'react';

import { useRootLoaderData } from '~/root';

import type { Settings } from '~/insomnia-data';
import type { SettingsOfType } from '../../../common/settings';
import { useSettingsPatcher } from '../../hooks/use-request';
import { HelpTooltip } from '../help-tooltip';
interface Props<T> {
  help?: ReactNode;
  label: string;
  setting: SettingsOfType<string>;
  values: {
    name: string;
    value: T;
  }[];
  onChange?: (value: T) => void;
}

export const EnumSetting = <T extends string | number>({
  help,
  label,
  setting,
  values,
  onChange,
}: PropsWithChildren<Props<T>>) => {
  const { settings } = useRootLoaderData()!;

  const patchSettings = useSettingsPatcher();

  return (
    <div className="form-control form-control--outlined">
      <label>
        {label}
        {help && <HelpTooltip className="space-left">{help}</HelpTooltip>}
        <select
          value={String(settings[setting]) || '__NULL__'}
          name={setting}
          onChange={event => {
            const value = event.currentTarget.value as unknown as T;
            if (onChange) {
              onChange(value);
            } else {
              patchSettings({ [setting]: event.currentTarget.value } as Partial<Settings>);
            }
          }}
        >
          {values.map(({ name, value }) => (
            <option key={value} value={value}>
              {name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

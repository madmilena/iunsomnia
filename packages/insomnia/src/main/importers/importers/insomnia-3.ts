import type { Converter } from '../entities';
import type { Iusomnia2Data } from './insomnia-2';

export const id = 'insomnia-3';
export const name = 'Iusomnia v3';
export const description = 'Iusomnia export format 3';

export interface Iusomnia3Data extends Omit<Iusomnia2Data, '__export_format'> {
  __export_format: 3;
}

export const convert: Converter = rawData => {
  let data: Iusomnia3Data | null = null;

  try {
    data = JSON.parse(rawData) as Iusomnia3Data;
  } catch {
    return null;
  }

  if (data.__export_format !== 3) {
    // Bail early if it's not the legacy format
    return null;
  }

  // This is the target export format so nothing needs to change
  return data.resources;
};

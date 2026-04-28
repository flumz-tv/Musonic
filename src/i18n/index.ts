import {t as fr} from './fr';
import {en} from './en';
import {useSettingsStore} from '../store/settingsStore';

type Dict = typeof fr;

const dicts: Record<string, Dict> = {
  fr,
  en: en as unknown as Dict,
};

export function useT(): Dict {
  const locale = useSettingsStore(s => s.locale);
  return dicts[locale] ?? fr;
}

export function getT(): Dict {
  const locale = useSettingsStore.getState().locale;
  return dicts[locale] ?? fr;
}

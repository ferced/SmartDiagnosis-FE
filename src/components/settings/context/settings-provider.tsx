import { useMemo, useState, useCallback } from 'react';

import { useLocalStorage } from 'src/hooks/use-local-storage';

import { localStorageGetItem } from 'src/utils/storage-available';

import { SettingsValueProps } from '../types';
import { SettingsContext } from './settings-context';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'settings';

type SettingsProviderProps = {
  children: React.ReactNode;
  defaultSettings: SettingsValueProps;
};

const directionOf = (lang?: string | null) => (lang === 'ar' ? 'rtl' : 'ltr');

// There is no settings drawer any more. The only setting a clinician can still
// change is the nav layout (the collapse button toggles vertical/mini), so it
// is the only one read back from storage; the text direction follows the
// language. Anything else the old drawer may have stored — dark mode,
// contrast, colour preset, stretch, horizontal nav, direction — is ignored,
// so nobody is left stuck with a theme they can no longer change.
export function SettingsProvider({ children, defaultSettings }: SettingsProviderProps) {
  const { state, update } = useLocalStorage(STORAGE_KEY, defaultSettings);

  const [themeDirection, setThemeDirection] = useState<SettingsValueProps['themeDirection']>(() =>
    directionOf(localStorageGetItem('i18nextLng'))
  );

  const onChangeDirectionByLang = useCallback((lang: string) => {
    setThemeDirection(directionOf(lang));
  }, []);

  const themeLayout: SettingsValueProps['themeLayout'] =
    state.themeLayout === 'vertical' || state.themeLayout === 'mini'
      ? state.themeLayout
      : defaultSettings.themeLayout;

  const memoizedValue = useMemo(
    () => ({
      ...defaultSettings,
      themeLayout,
      themeDirection,
      onUpdate: update,
      onChangeDirectionByLang,
    }),
    [defaultSettings, themeLayout, themeDirection, update, onChangeDirectionByLang]
  );

  return <SettingsContext.Provider value={memoizedValue}>{children}</SettingsContext.Provider>;
}

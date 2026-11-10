import { useEffect, useState } from 'react';

export type Theme = 'neutral' | 'wwp';
export const THEME_STORAGE_KEY = 'cfm-theme';

function loadTheme(): Theme {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'wwp' ? 'wwp' : 'neutral';
  } catch {
    return 'neutral';
  }
}

/**
 * Viewer preference, stored separately from the demo data so that
 * "Reset Demo Data" does not change the look.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage unavailable — the theme still applies for this session.
    }
  }, [theme]);

  return { theme, setTheme };
}

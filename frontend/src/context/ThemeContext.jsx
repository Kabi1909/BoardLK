import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const readPreference = () => {
  try {
    const value = localStorage.getItem('boardlk-theme');
    return ['light', 'dark'].includes(value) ? value : null;
  } catch {
    return null;
  }
};

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const theme = preference || (systemDark ? 'dark' : 'light');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = (event) => setSystemDark(event.matches);
    const onStorage = (event) => {
      if (event.key === 'boardlk-theme' || event.key === null) setPreference(readPreference());
    };
    media.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0d1916' : '#176b52');
  }, [theme]);
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setPreference(next);
    try {
      localStorage.setItem('boardlk-theme', next);
    } catch {
      /* Still works for this visit. */
    }
  };
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

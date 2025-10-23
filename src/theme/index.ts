import { Theme, ThemeMode } from '../types/theme';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

export const createTheme = (mode: ThemeMode): Theme => ({
  mode,
  colors: mode === 'light' ? lightColors : darkColors,
  typography,
  spacing,
});

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');

export * from './colors';
export * from './typography';
export * from './spacing';
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  success: string;
  border: string;
}

export interface Typography {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  body: TextStyle;
  caption: TextStyle;
  button: TextStyle;
}

export interface TextStyle {
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
}

export type ThemeMode = 'light' | 'dark';
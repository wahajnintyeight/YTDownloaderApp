import { ColorPalette } from '../types/theme';

export const lightColors: ColorPalette = {
  // Single YouTube red used consistently across the app
  primary: '#FF0000',
  secondary: '#FF0000',
  // YouTube-style blue accent (e.g. for links, highlights)
  accent: '#3EA6FF',
  background: '#FFFFFF',
  surface: '#F7F7F7',
  text: '#2D3436',
  textSecondary: '#636E72',
  error: '#FF3838',
  success: '#00B894',
  border: '#DFE6E9',
};

export const darkColors: ColorPalette = {
  // Single YouTube red used consistently across the app
  primary: '#FF0000',
  secondary: '#FF0000',
  // YouTube-style blue accent (e.g. for links, highlights)
  accent: '#3EA6FF',
  background: '#0A0A0A',   // Deeper near-true black
  surface: '#121212',      // Dark surface with subtle elevation
  text: '#FFFFFF',
  textSecondary: '#C7D0D4',
  error: '#FF3838',
  success: '#00B894',
  border: '#1F1F1F',       // Darker border for subtle separation
};
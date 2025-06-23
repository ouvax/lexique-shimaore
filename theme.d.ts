// theme.d.ts
import '@react-navigation/native';

declare module '@react-navigation/native' {
  interface ThemeColors {
    success: string;
    error: string;
  }
}

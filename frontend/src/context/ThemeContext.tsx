export type Theme = 'dark' | 'light' | 'solarized' | 'one-dark' | 'monokai';

export interface ThemeDefinition {
  id: Theme;
  name: string;
  colors: Record<string, string>;
}

export interface TestableFont {
  readonly id: string;
  readonly name: string;
  readonly family: string;
  readonly category: string;
  readonly weightRange: string;
  readonly defaultWeight: number;
  readonly notes: string;
}

/**
 * 🎨 AVAILABLE FONTS REGISTRY
 *
 * To add any new font to test:
 * 1. Place the `.woff2` font file into `public/fonts/<your-font>.woff2`
 * 2. Register its `@font-face` in `src/styles/_fonts.scss`
 * 3. Add an entry to `FONTS_TO_TEST` below.
 *
 * The Playground will automatically render a button for it and let you preview
 * it across all scales or numbers in 1 click!
 */
export const FONTS_TO_TEST: readonly TestableFont[] = [
  {
    id: 'melodrama',
    name: 'Melodrama',
    family: "'Melodrama', serif",
    category: 'Display Serif',
    weightRange: '300 – 700',
    defaultWeight: 700,
    notes: 'Active default for metrics & numbers',
  },
  {
    id: 'satoshi',
    name: 'Satoshi',
    family: "'Satoshi', sans-serif",
    category: 'Neo-Grotesque Sans',
    weightRange: '300 – 900',
    defaultWeight: 700,
    notes: 'Clean, modern sans alternative',
  },
  {
    id: 'chillax',
    name: 'Chillax',
    family: "'Chillax', sans-serif",
    category: 'Geometric Display',
    weightRange: '200 – 700',
    defaultWeight: 600,
    notes: 'Modern wide geometric display for hero & headers',
  },
  {
    id: 'google-sans',
    name: 'Google Sans Flex',
    family: "'Google Sans Flex', sans-serif",
    category: 'Geometric Sans',
    weightRange: '400 – 800',
    defaultWeight: 400,
    notes: 'Default primary UI & body font',
  },
];

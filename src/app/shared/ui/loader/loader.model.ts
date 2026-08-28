export type LoaderHeight = '10' | '20' | '30' | '40' | '50' | '60' | '70' | '80' | '90' | 'full' | 'parent';

export const LOADER_HEIGHT_CLASSES: Record<LoaderHeight, string> = {
  '10': 'dvh-10',
  '20': 'dvh-20',
  '30': 'dvh-30',
  '40': 'dvh-40',
  '50': 'dvh-50',
  '60': 'dvh-60',
  '70': 'dvh-70',
  '80': 'dvh-80',
  '90': 'dvh-90',
  full: 'dvh-full',
  parent: 'h-full min-h-full',
};

export const LOADER_HEIGHT_CLASSES_PADDED: Record<LoaderHeight, string> = {
  '10': 'dvh-page-10',
  '20': 'dvh-page-20',
  '30': 'dvh-page-30',
  '40': 'dvh-page-40',
  '50': 'dvh-page-50',
  '60': 'dvh-page-60',
  '70': 'dvh-page-70',
  '80': 'dvh-page-80',
  '90': 'dvh-page-90',
  full: 'dvh-page-full',
  parent: 'h-full min-h-full',
};

export type PlaygroundTab =
  | 'all'
  | 'colors'
  | 'gsap'
  | 'typography'
  | 'buttons'
  | 'icons'
  | 'badges'
  | 'forms'
  | 'cards'
  | 'textures'
  | 'tables'
  | 'dialogs'
  | 'loaders'
  | 'branding';

export interface TabItem {
  id: PlaygroundTab;
  label: string;
  icon: string;
}

export const PLAYGROUND_TABS: readonly TabItem[] = [
  { id: 'all', label: 'All Components', icon: 'grid_view' },
  { id: 'colors', label: 'Colors & Tokens', icon: 'palette' },
  { id: 'gsap', label: 'GSAP', icon: 'animation' },
  { id: 'typography', label: 'Typography', icon: 'text_fields' },
  { id: 'buttons', label: 'Buttons & Checkboxes', icon: 'smart_button' },
  { id: 'icons', label: 'Iconography', icon: 'stars' },
  { id: 'badges', label: 'Badges & Chips', icon: 'label' },
  { id: 'forms', label: 'Signal Forms', icon: 'edit_document' },
  { id: 'cards', label: 'Cards & Surfaces', icon: 'style' },
  { id: 'textures', label: 'Textures & FX', icon: 'grain' },
  { id: 'tables', label: 'Data Table', icon: 'table_chart' },
  { id: 'dialogs', label: 'Dialogs & Toasts', icon: 'chat_bubble' },
  { id: 'loaders', label: 'Loaders', icon: 'progress_activity' },
  { id: 'branding', label: 'Branding', icon: 'diamond' },
] as const;

/**
 * Every icon name the admin dashboard renders.
 *
 * Kebab-case by convention — deliberately *not* Material's snake_case
 * ligature names, since callers reference these names in admin content
 * and component logic. `ADMIN_ICON_GLYPH` below maps each of these to
 * the actual Material Symbols ligature rendered through `<mat-icon>`.
 */
export type AdminIconName =
  | 'dashboard'
  | 'inbox'
  | 'logout'
  | 'refresh'
  | 'error-outline'
  | 'archive'
  | 'mark-email-read'
  | 'mark-email-unread'
  | 'search'
  | 'search-off'
  | 'download'
  | 'table-chart'
  | 'data-object'
  | 'cloud-off'
  | 'arrow-back'
  | 'cancel'
  | 'inventory'
  | 'pending-actions'
  | 'date-range'
  | 'mail'
  | 'assignment'
  | 'event'
  | 'description';

/**
 * Maps every `AdminIconName` to its Material Symbols glyph ligature.
 *
 * Admin components render icons through `<mat-icon [name]="ADMIN_ICON_GLYPH['...']" />`
 * (via `SharedIconModule`, `@shared/ui/mat-icon`) rather than the bespoke inline-SVG
 * `AdminIcon` component this file used to export. Most names are a direct
 * kebab-case → snake_case rename; two are not:
 * - `error-outline` → `error` (Material Symbols has no separate "outline" variant name)
 * - `inventory` → `inventory_2` (Material's plain `inventory` glyph looks visually thin;
 *   `inventory_2` is the filled-box glyph this dashboard was designed against)
 */
export const ADMIN_ICON_GLYPH: Record<AdminIconName, string> = {
  dashboard: 'dashboard',
  inbox: 'inbox',
  logout: 'logout',
  refresh: 'refresh',
  'error-outline': 'error',
  archive: 'archive',
  'mark-email-read': 'mark_email_read',
  'mark-email-unread': 'mark_email_unread',
  search: 'search',
  'search-off': 'search_off',
  download: 'download',
  'table-chart': 'table_chart',
  'data-object': 'data_object',
  'cloud-off': 'cloud_off',
  'arrow-back': 'arrow_back',
  cancel: 'cancel',
  inventory: 'inventory_2',
  'pending-actions': 'pending_actions',
  'date-range': 'date_range',
  mail: 'mail',
  assignment: 'assignment',
  event: 'event',
  description: 'description',
};

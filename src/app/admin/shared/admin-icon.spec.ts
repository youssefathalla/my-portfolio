import { ADMIN_ICON_GLYPH, AdminIconName } from './admin-icon';

describe('ADMIN_ICON_GLYPH', () => {
  const allIconNames: readonly AdminIconName[] = [
    'dashboard',
    'inbox',
    'logout',
    'refresh',
    'error-outline',
    'archive',
    'mark-email-read',
    'mark-email-unread',
    'search',
    'search-off',
    'download',
    'table-chart',
    'data-object',
    'cloud-off',
    'arrow-back',
    'cancel',
    'inventory',
    'pending-actions',
    'date-range',
    'mail',
    'assignment',
    'event',
    'description',
  ];

  it('has exactly 23 entries', () => {
    expect(Object.keys(ADMIN_ICON_GLYPH).length).toBe(23);
  });

  it.each(allIconNames)('maps %s to a non-empty glyph string', (name) => {
    const glyph = ADMIN_ICON_GLYPH[name];
    expect(typeof glyph).toBe('string');
    expect(glyph.length).toBeGreaterThan(0);
  });

  it('every AdminIconName is present as a key', () => {
    const keys = Object.keys(ADMIN_ICON_GLYPH);
    for (const name of allIconNames) {
      expect(keys).toContain(name);
    }
  });

  it("maps the 'error-outline' exception to Material's 'error' glyph", () => {
    expect(ADMIN_ICON_GLYPH['error-outline']).toBe('error');
  });

  it("maps the 'inventory' exception to Material's 'inventory_2' glyph", () => {
    expect(ADMIN_ICON_GLYPH['inventory']).toBe('inventory_2');
  });
});

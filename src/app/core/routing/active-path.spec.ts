import { describe, expect, it } from 'vitest';
import { normalizeActivePath } from './active-path';

describe('normalizeActivePath', () => {
  it('handles empty string', () => {
    expect(normalizeActivePath('')).toBe('');
  });

  it('removes leading slash', () => {
    expect(normalizeActivePath('/services')).toBe('services');
  });

  it('removes multiple leading slashes', () => {
    expect(normalizeActivePath('///services')).toBe('services');
  });

  it('removes trailing slash', () => {
    expect(normalizeActivePath('/services/')).toBe('services');
  });

  it('removes multiple trailing slashes', () => {
    expect(normalizeActivePath('/services///')).toBe('services');
  });

  it('handles slash-only inputs', () => {
    expect(normalizeActivePath('/')).toBe('');
    expect(normalizeActivePath('///')).toBe('');
  });

  it('strips query parameters and fragments', () => {
    expect(normalizeActivePath('/ar/services?tab=1#details')).toBe('ar/services');
    expect(normalizeActivePath('/case-studies/?filter=all#top')).toBe('case-studies');
  });

  it('handles nested route paths with interior slashes intact', () => {
    expect(normalizeActivePath('/ar/case-studies/sub-project/')).toBe('ar/case-studies/sub-project');
  });

  it('handles query-only or fragment-only inputs', () => {
    expect(normalizeActivePath('?query=1')).toBe('');
    expect(normalizeActivePath('#fragment')).toBe('');
  });
});

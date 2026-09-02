import { describe, it, expect } from 'vitest';
import { addTag, removeTag, TAG_CONSTRAINTS } from './tag-rules';

describe('TAG_CONSTRAINTS', () => {
  it('mirrors the Firestore Security_Rules limits', () => {
    expect(TAG_CONSTRAINTS).toEqual({ maxTags: 20, minLength: 1, maxLength: 32 });
  });
});

describe('addTag', () => {
  describe('rejection precedence: empty -> too-long -> duplicate -> limit-reached', () => {
    it('rejects empty string with reason "empty"', () => {
      expect(addTag([], '')).toEqual({ ok: false, reason: 'empty' });
    });

    it('rejects whitespace-only string with reason "empty" (trimmed first)', () => {
      expect(addTag([], '   ')).toEqual({ ok: false, reason: 'empty' });
      expect(addTag([], '\t\n')).toEqual({ ok: false, reason: 'empty' });
    });

    it('rejects too-long tag (> 32 chars) with reason "too-long"', () => {
      const long = 'a'.repeat(33);
      expect(addTag([], long)).toEqual({ ok: false, reason: 'too-long' });
    });

    it('rejects exactly at boundary: 32 chars succeeds, 33 chars fails', () => {
      const at32 = 'a'.repeat(32);
      const at33 = 'a'.repeat(33);
      const result32 = addTag([], at32);
      expect(result32.ok).toBe(true);
      expect(addTag([], at33)).toEqual({ ok: false, reason: 'too-long' });
    });

    it('rejects duplicate (case-insensitive) with reason "duplicate"', () => {
      expect(addTag(['Urgent'], 'urgent')).toEqual({ ok: false, reason: 'duplicate' });
      expect(addTag(['urgent'], 'URGENT')).toEqual({ ok: false, reason: 'duplicate' });
      expect(addTag(['Foo'], 'foo')).toEqual({ ok: false, reason: 'duplicate' });
    });

    it('rejects when at maxTags limit with reason "limit-reached"', () => {
      const full = Array.from({ length: 20 }, (_, i) => `tag${i}`);
      expect(addTag(full, 'new-tag')).toEqual({ ok: false, reason: 'limit-reached' });
    });

    it('precedence: empty wins over too-long (whitespace pads beyond 32)', () => {
      // A string that, when not trimmed, is >32 but trims to empty
      const emptyWhenTrimmed = ' '.repeat(40);
      expect(addTag([], emptyWhenTrimmed)).toEqual({ ok: false, reason: 'empty' });
    });

    it('precedence: too-long wins over duplicate', () => {
      const long = 'a'.repeat(33);
      // Even if it would be a duplicate, too-long comes first
      expect(addTag([long], long)).toEqual({ ok: false, reason: 'too-long' });
    });

    it('precedence: duplicate wins over limit-reached', () => {
      const full = Array.from({ length: 20 }, (_, i) => `tag${i}`);
      // tag0 is already present and array is full
      expect(addTag(full, 'tag0')).toEqual({ ok: false, reason: 'duplicate' });
    });
  });

  describe('successful addition', () => {
    it('appends the trimmed candidate to an empty array', () => {
      const result = addTag([], 'hello');
      expect(result).toEqual({ ok: true, tags: ['hello'] });
    });

    it('appends to an existing array without reordering', () => {
      const result = addTag(['alpha', 'beta'], 'gamma');
      expect(result).toEqual({ ok: true, tags: ['alpha', 'beta', 'gamma'] });
    });

    it('trims leading and trailing whitespace from the candidate', () => {
      const result = addTag([], '  trimmed  ');
      expect(result).toEqual({ ok: true, tags: ['trimmed'] });
    });

    it('preserves the user-supplied casing', () => {
      const result = addTag([], 'Urgent');
      expect(result).toEqual({ ok: true, tags: ['Urgent'] });
    });

    it('does not mutate the input array', () => {
      const existing = ['a', 'b'];
      const frozenExisting = Object.freeze([...existing]);
      const result = addTag(frozenExisting, 'c');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.tags).toEqual(['a', 'b', 'c']);
      }
      expect(frozenExisting).toEqual(['a', 'b']);
    });

    it('allows 1-character tags (minLength boundary)', () => {
      const result = addTag([], 'x');
      expect(result).toEqual({ ok: true, tags: ['x'] });
    });

    it('allows 32-character tags (maxLength boundary)', () => {
      const tag = 'a'.repeat(32);
      const result = addTag([], tag);
      expect(result).toEqual({ ok: true, tags: [tag] });
    });

    it('allows adding to an array with 19 tags (one below limit)', () => {
      const existing = Array.from({ length: 19 }, (_, i) => `tag${i}`);
      const result = addTag(existing, 'tag19');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.tags).toHaveLength(20);
      }
    });
  });
});

describe('removeTag', () => {
  it('removes a tag by case-insensitive match', () => {
    expect(removeTag(['Urgent', 'low'], 'urgent')).toEqual(['low']);
    expect(removeTag(['Urgent', 'low'], 'URGENT')).toEqual(['low']);
  });

  it('removes all case-insensitive matches (if somehow duplicates exist)', () => {
    expect(removeTag(['foo', 'Foo', 'FOO', 'bar'], 'foo')).toEqual(['bar']);
  });

  it('returns the original array by reference when no match is found', () => {
    const existing = ['alpha', 'beta'];
    const result = removeTag(existing, 'gamma');
    expect(result).toBe(existing);
  });

  it('preserves relative order of remaining tags', () => {
    expect(removeTag(['a', 'b', 'c', 'd'], 'b')).toEqual(['a', 'c', 'd']);
  });

  it('handles empty array', () => {
    const empty: string[] = [];
    expect(removeTag(empty, 'anything')).toBe(empty);
  });

  it('does not trim the tag parameter for removal', () => {
    // If someone passes ' foo ', it should match against ' foo ' not 'foo'
    expect(removeTag(['foo', 'bar'], ' foo ')).toEqual(['foo', 'bar']);
  });
});

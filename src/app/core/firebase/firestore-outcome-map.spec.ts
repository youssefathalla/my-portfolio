import { describe, it, expect } from 'vitest';
import { mapFirestoreErrorToOutcome } from './firestore-outcome-map';

describe('mapFirestoreErrorToOutcome', () => {
  it('maps permission-denied to http-error 403', () => {
    const result = mapFirestoreErrorToOutcome({ code: 'permission-denied' });
    expect(result).toEqual({ kind: 'http-error', status: 403 });
  });

  it('maps unavailable to network-error', () => {
    const result = mapFirestoreErrorToOutcome({ code: 'unavailable' });
    expect(result).toEqual({ kind: 'network-error' });
  });

  it('maps resource-exhausted to http-error 429', () => {
    const result = mapFirestoreErrorToOutcome({ code: 'resource-exhausted' });
    expect(result).toEqual({ kind: 'http-error', status: 429 });
  });

  it('maps unauthenticated to http-error 401', () => {
    const result = mapFirestoreErrorToOutcome({ code: 'unauthenticated' });
    expect(result).toEqual({ kind: 'http-error', status: 401 });
  });

  it('maps invalid-argument to http-error 400', () => {
    const result = mapFirestoreErrorToOutcome({ code: 'invalid-argument' });
    expect(result).toEqual({ kind: 'http-error', status: 400 });
  });

  it('maps an unrecognized error code to http-error 500', () => {
    const result = mapFirestoreErrorToOutcome({ code: 'data-loss' });
    expect(result).toEqual({ kind: 'http-error', status: 500 });
  });

  it('handles firestore/ prefixed codes: permission-denied', () => {
    const result = mapFirestoreErrorToOutcome({ code: 'firestore/permission-denied' });
    expect(result).toEqual({ kind: 'http-error', status: 403 });
  });

  it('handles firestore/ prefixed codes: unavailable', () => {
    const result = mapFirestoreErrorToOutcome({ code: 'firestore/unavailable' });
    expect(result).toEqual({ kind: 'network-error' });
  });

  it('handles firestore/ prefixed codes: resource-exhausted', () => {
    const result = mapFirestoreErrorToOutcome({ code: 'firestore/resource-exhausted' });
    expect(result).toEqual({ kind: 'http-error', status: 429 });
  });

  it('maps null to http-error 500', () => {
    const result = mapFirestoreErrorToOutcome(null);
    expect(result).toEqual({ kind: 'http-error', status: 500 });
  });

  it('maps undefined to http-error 500', () => {
    const result = mapFirestoreErrorToOutcome(undefined);
    expect(result).toEqual({ kind: 'http-error', status: 500 });
  });

  it('maps a string to http-error 500', () => {
    const result = mapFirestoreErrorToOutcome('some error');
    expect(result).toEqual({ kind: 'http-error', status: 500 });
  });

  it('maps a number to http-error 500', () => {
    const result = mapFirestoreErrorToOutcome(42);
    expect(result).toEqual({ kind: 'http-error', status: 500 });
  });

  it('maps an object without a code property to http-error 500', () => {
    const result = mapFirestoreErrorToOutcome({ message: 'something failed' });
    expect(result).toEqual({ kind: 'http-error', status: 500 });
  });

  it('maps an object with an empty code to http-error 500', () => {
    const result = mapFirestoreErrorToOutcome({ code: '' });
    expect(result).toEqual({ kind: 'http-error', status: 500 });
  });

  it('maps an object with a non-string code to http-error 500', () => {
    const result = mapFirestoreErrorToOutcome({ code: 123 });
    expect(result).toEqual({ kind: 'http-error', status: 500 });
  });
});

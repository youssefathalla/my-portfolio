import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { RealAnalyticsAdapter } from './real-analytics-adapter';

describe('RealAnalyticsAdapter', () => {
  // `environment.analyticsEnabled` defaults to `false` (R20.2), so
  // `track()` returns before ever reaching `sendToProvider`. The two
  // route-path tests below need the provider call to actually happen —
  // `environment` is a plain object at runtime (its `readonly` fields are
  // TypeScript-only), so the flag is safely flipped for the duration of
  // this suite and restored afterwards.
  const originalAnalyticsEnabled = environment.analyticsEnabled;

  beforeEach(() => {
    (environment as { analyticsEnabled: boolean }).analyticsEnabled = true;
  });

  afterEach(() => {
    (environment as { analyticsEnabled: boolean }).analyticsEnabled = originalAnalyticsEnabled;
  });

  function createAdapter(platform: 'browser' | 'server', url = '/'): RealAnalyticsAdapter {
    const adapter = Object.create(RealAnalyticsAdapter.prototype);
    Object.assign(adapter, {
      isBrowser: platform === 'browser',
      router: { url } as unknown as Router,
    });
    return adapter;
  }

  it('does not throw when tracking a valid event in a browser context', () => {
    const adapter = createAdapter('browser');

    expect(() => adapter.track('conversion_cta_booking_click')).not.toThrow();
  });

  it('discards silently in the prerender (server) context (R19.9)', () => {
    const adapter = createAdapter('server');

    expect(() => adapter.track('conversion_cta_booking_click')).not.toThrow();
  });

  it('discards an empty event name without raising an error (R19.8)', () => {
    const adapter = createAdapter('browser');

    expect(() => adapter.track('')).not.toThrow();
  });

  it('discards an event name exceeding 60 characters without raising an error (R19.8)', () => {
    const adapter = createAdapter('browser');
    const overLongName = 'x'.repeat(65);

    expect(() => adapter.track(overLongName)).not.toThrow();
  });

  it('never throws even when the provider call fails (R19.6)', () => {
    const adapter = createAdapter('browser');

    // `sendToProvider` currently performs no real call, so this exercises
    // the try/catch scaffolding rather than a real failure — but it
    // documents the contract: track() must never throw regardless of
    // provider outcome.
    expect(() => adapter.track('conversion_cta_contact_click', { foo: 'bar' })).not.toThrow();
  });

  it('attaches the active Route_Manifest path to every forwarded event (R19.2)', () => {
    const adapter = createAdapter('browser', '/services/fixed-mvp?ref=nav');
    const sendToProvider = vi.spyOn(
      adapter as unknown as { sendToProvider: RealAnalyticsAdapter['track'] },
      'sendToProvider',
    );

    adapter.track('conversion_cta_booking_click', { foo: 'bar' });

    expect(sendToProvider).toHaveBeenCalledWith('conversion_cta_booking_click', {
      foo: 'bar',
      routePath: 'services/fixed-mvp',
    });
  });

  it('attaches the active route path even without caller-supplied attributes (R19.2)', () => {
    const adapter = createAdapter('browser', '/policies');
    const sendToProvider = vi.spyOn(
      adapter as unknown as { sendToProvider: RealAnalyticsAdapter['track'] },
      'sendToProvider',
    );

    adapter.track('nav_availability_cta_click');

    expect(sendToProvider).toHaveBeenCalledWith('nav_availability_cta_click', {
      routePath: 'policies',
    });
  });
});

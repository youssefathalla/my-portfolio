import { Service, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { isBrowser } from '../platform/platform';
import { normalizeActivePath } from '../routing/active-path';
import { AnalyticsAdapter, isValidEvent, type AnalyticsAttributes } from './analytics';

const ROUTE_PATH_ATTRIBUTE_KEY = 'routePath';

/**
 * Production analytics adapter that tracks user events and auto-attaches
 * the normalized active route path.
 */
@Service()
export class RealAnalyticsAdapter extends AnalyticsAdapter {
  private readonly isBrowser = isBrowser();
  private readonly router = inject(Router);

  override track(event: string, attributes?: AnalyticsAttributes): void {
    // 1. Never run analytics on the server during SSR / prerendering
    if (!this.isBrowser) return;

    // 2. Validate event name and attributes length / limits
    if (!isValidEvent(event, attributes)) return;

    // 3. Ensure analytics is enabled in current environment
    if (!environment.analyticsEnabled) return;

    // 4. Attach active route path
    const augmentedAttributes: AnalyticsAttributes = {
      ...attributes,
      [ROUTE_PATH_ATTRIBUTE_KEY]: normalizeActivePath(this.router.url),
    };

    try {
      this.sendToProvider(event, augmentedAttributes);
    } catch {
      // Silently swallow vendor SDK errors to prevent app crashes or blocking user actions
    }
  }

  /**
   * Integration point for third-party analytics vendors (e.g. GA4, PostHog, Mixpanel).
   */
  private sendToProvider(event: string, attributes?: AnalyticsAttributes): void {
    void event;
    void attributes;
  }
}


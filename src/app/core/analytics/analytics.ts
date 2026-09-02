import { Service } from '@angular/core';

/** Flat key-value attributes attached to tracked analytics events. */
export type AnalyticsAttributes = Readonly<Record<string, string>>;

const MAX_EVENT_NAME_LENGTH = 64;
const MAX_ATTRIBUTE_COUNT = 10;
const MAX_ATTRIBUTE_FIELD_LENGTH = 64;

/**
 * Validates that an event name and its attributes conform to length and count bounds.
 */
export function isValidEvent(event: string, attributes?: AnalyticsAttributes): boolean {
  if (event.length < 1 || event.length > MAX_EVENT_NAME_LENGTH) {
    return false;
  }

  if (attributes == null) return true;

  const entries = Object.entries(attributes);
  if (entries.length > MAX_ATTRIBUTE_COUNT) return false;

  return entries.every(
    ([key, value]) =>
      key.length <= MAX_ATTRIBUTE_FIELD_LENGTH && value.length <= MAX_ATTRIBUTE_FIELD_LENGTH,
  );
}

/**
 * Abstract analytics adapter base class.
 * Components depend on this class so the underlying vendor implementation can be swapped cleanly in app.config.ts.
 */
export abstract class AnalyticsAdapter {
  abstract track(event: string, attributes?: AnalyticsAttributes): void;
}

/**
 * Default no-op analytics adapter when analytics is disabled in the environment.
 */
@Service()
export class NoopAnalyticsAdapter extends AnalyticsAdapter {
  override track(event: string, attributes?: AnalyticsAttributes): void {
    isValidEvent(event, attributes);
  }
}

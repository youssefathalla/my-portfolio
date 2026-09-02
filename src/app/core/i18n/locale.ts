import { InjectionToken } from '@angular/core';

/** Supported locales and text direction primitives. */
export type Locale = 'en' | 'ar';

/** Supported locales list. */
export const LOCALES: readonly Locale[] = ['en', 'ar'] as const;

/** Default application locale. */
export const DEFAULT_LOCALE: Locale = 'en';

/** Supported reading directions. */
export type Direction = 'ltr' | 'rtl';

/** Localized string map keyed by Locale. */
export type LocalizedText = Record<Locale, string>;

/** Returns the reading direction ('ltr' or 'rtl') for a given locale. */
export function directionFor(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** Active route locale token. Must be provided in a locale route group. */
export const LOCALE = new InjectionToken<Locale>('LOCALE');

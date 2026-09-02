/** Route metadata assertion helpers to prevent blank SEO tags during build/prerender. */
import { isBlank } from '../text/text';
import type { RouteMetadata } from '../routing/route-manifest';
import { DEFAULT_LOCALE, type Locale } from '../i18n/locale';

/** Validates required SEO metadata fields and baseUrl, throwing descriptive errors on blank values. */
export function assertSeoConfigured(
  metadata: RouteMetadata,
  siteBaseUrl: string,
  routeKey: string,
  locale: Locale,
): void {
  if (isBlank(metadata.title)) {
    throw new Error(
      `Route_Metadata for route "${routeKey}" has a blank title: the prerendered <title> element requires a non-empty value (R3.1, R3.9).`,
    );
  }
  if (isBlank(metadata.description)) {
    throw new Error(
      `Route_Metadata for route "${routeKey}" has a blank description: the prerendered meta description requires a non-empty value (R3.2, R3.9).`,
    );
  }
  if (isBlank(metadata.socialImagePath)) {
    throw new Error(
      `Route_Metadata for route "${routeKey}" has a blank socialImagePath: og:image and twitter:image both require a non-empty value (R3.4, R3.5, R3.9).`,
    );
  }
  if (!(routeKey === 'landing' && locale === DEFAULT_LOCALE) && isBlank(metadata.canonicalPath)) {
    throw new Error(
      `Route_Metadata for route "${routeKey}" (locale "${locale}") has a blank canonicalPath: ` +
      `only the Default_Locale Landing_Route may declare an empty canonical path (R2.6, R3.9, arabic-rtl-infrastructure R7.7).`,
    );
  }
  if (isBlank(siteBaseUrl)) {
    throw new Error(
      `environment.baseUrl is blank while initialising route "${routeKey}": the canonical URL, og:url, twitter:image resolution, and JSON-LD url all derive from Site_Base_Url (R3.9).`,
    );
  }
}

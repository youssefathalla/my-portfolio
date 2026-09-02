/**
 * Sets document title, meta tags (Open Graph, Twitter, robots),
 * canonical/alternate links, and JSON-LD structured data for routes.
 */
import { DOCUMENT } from '@angular/common';
import { Service, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '@env/environment';
import { DEFAULT_LOCALE, LOCALES } from '../i18n/locale';
import type { Locale } from '../i18n/locale';
import { SEO_CONTENT } from './seo.content';
import {
  ROUTE_MANIFEST,
  toCanonicalUrl,
  toLocalizedPath,
  type RouteMetadata,
} from '../routing/route-manifest';
import { assertSeoConfigured } from './seo.assertions';

/** Locates the JSON-LD Person script for idempotent updates. */
const PERSON_JSONLD_SELECTOR = 'script[type="application/ld+json"][data-seo="person"]';

/** Locates the JSON-LD Service script for idempotent updates. */
const SERVICE_JSONLD_SELECTOR = 'script[type="application/ld+json"][data-seo="service"]';

/** Selector used to locate the robots meta tag. */
const ROBOTS_META_SELECTOR = 'name="robots"';

/** Selector for all hreflang alternate link elements. */
const ALTERNATE_LINK_SELECTOR = 'link[rel="alternate"][hreflang]';

/** Open Graph locale value per Locale. */
const OG_LOCALE_VALUE: Readonly<Record<Locale, string>> = { en: 'en_US', ar: 'ar_AR' };

/** Service-specific fields for generating JSON-LD Service schema. */
export interface ServiceJsonLd {
  /** Offering headline or short name. */
  readonly name: string;
  /** Meta description or equivalent summary. */
  readonly description: string;
  /** Schema.org Service serviceType (e.g. 'Software Development'). */
  readonly serviceType: string;
}

/** Narrow title/description/noindex options for individual pages. */
export interface SeoMetadata {
  readonly title: string;
  readonly description: string;
  /** Directs crawlers not to index or follow links on the page. */
  readonly noindex?: boolean;
}

@Service()
export class SeoService {
  readonly #titleService = inject(Title);
  readonly #meta = inject(Meta);
  readonly #document = inject(DOCUMENT);

  /** Initializes landing page SEO metadata and JSON-LD Person schema. */
  initLanding(locale: Locale): void {
    const { title, description, ogImagePath, person } = SEO_CONTENT[locale];
    const metadata: RouteMetadata = {
      title,
      description,
      canonicalPath: toLocalizedPath('', locale),
      socialImagePath: ogImagePath,
    };

    const { canonicalUrl } = this.#applyMetadata(metadata, 'landing', locale);

    // JSON-LD Person entity (R3.6, R3.7). `url` reads the same
    // canonicalUrl as og:url and the canonical link href.
    this.#setPersonJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: person.name,
      jobTitle: person.jobTitle,
      url: canonicalUrl,
      email: person.email,
      knowsAbout: person.knowsAbout,
      sameAs: person.sameAs,
    });
  }

  /**
   * Any Service_Route entry point: `applyMetadata` plus a JSON-LD
   * `Service` script whose `provider.name` equals the JSON-LD `Person`
   * entity's name (R3.6).
   */
  initServiceRoute(
    metadata: RouteMetadata,
    routeKey: string,
    locale: Locale,
    service: ServiceJsonLd,
  ): void {
    const { canonicalUrl } = this.#applyMetadata(metadata, routeKey, locale);

    this.#setServiceJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.name,
      description: service.description,
      serviceType: service.serviceType,
      url: canonicalUrl,
      provider: {
        '@type': 'Person',
        name: SEO_CONTENT[locale].person.name,
      },
    });
  }

  /** Sets standard SEO metadata for static routes (without JSON-LD). */
  initRoute(metadata: RouteMetadata, routeKey: string, locale: Locale): void {
    this.#applyMetadata(metadata, routeKey, locale);
  }

  /** Configures metadata for unlisted routes, applying robots directive and removing canonical/alternate links. */
  initExcludedRoute(title: string, robots = 'noindex'): void {
    this.#titleService.setTitle(title);
    this.#meta.updateTag({ name: 'robots', content: robots });
    this.#removeCanonicalLink();
    this.#removeAlternateLinks();
    this.#meta.removeTag('property="og:locale"');
    this.#meta.removeTag('property="og:locale:alternate"');
  }

  /** Sets 404 page title, adds noindex robots tag, and removes canonical link. */
  initNotFound(title: string): void {
    this.initExcludedRoute(title);
  }

  /** Sets basic page title, description, and robots directives. */
  setPageMetadata(config: SeoMetadata): void {
    this.#titleService.setTitle(config.title);
    this.#meta.updateTag({ name: 'description', content: config.description });
    this.#meta.updateTag({
      name: 'robots',
      content: config.noindex === true ? 'noindex, nofollow' : 'index, follow',
    });
  }

  /** Applies common route metadata: title, description, canonical link, OG/Twitter tags, and hreflang links. */
  #applyMetadata(
    metadata: RouteMetadata,
    routeKey: string,
    locale: Locale,
  ): { canonicalUrl: string } {
    assertSeoConfigured(metadata, environment.baseUrl, routeKey, locale);

    const { title, description } = metadata;
    const canonicalUrl = toCanonicalUrl(metadata.canonicalPath, environment.baseUrl);
    const ogImageUrl = new URL(metadata.socialImagePath, environment.baseUrl).toString();

    this.#titleService.setTitle(title);
    this.#meta.updateTag({ name: 'description', content: description });

    // Open Graph tags
    this.#meta.updateTag({ property: 'og:title', content: title });
    this.#meta.updateTag({ property: 'og:description', content: description });
    this.#meta.updateTag({ property: 'og:type', content: 'website' });
    this.#meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.#meta.updateTag({ property: 'og:image', content: ogImageUrl });

    // Twitter card tags
    this.#meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.#meta.updateTag({ name: 'twitter:title', content: title });
    this.#meta.updateTag({ name: 'twitter:description', content: description });
    this.#meta.updateTag({ name: 'twitter:image', content: ogImageUrl });

    // Locale tags
    this.#meta.removeTag('property="og:locale:alternate"');
    this.#meta.updateTag({ property: 'og:locale', content: OG_LOCALE_VALUE[locale] });
    for (const other of LOCALES) {
      if (other !== locale) {
        this.#meta.addTag({ property: 'og:locale:alternate', content: OG_LOCALE_VALUE[other] });
      }
    }

    this.#setAlternateLinks(routeKey);
    this.#setCanonicalLink(canonicalUrl);
    this.#meta.removeTag(ROBOTS_META_SELECTOR);

    return { canonicalUrl };
  }

  /** Creates or updates the canonical link element. */
  #setCanonicalLink(href: string): void {
    let link = this.#document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.#document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.#document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  /** Removes the canonical link element if present. */
  #removeCanonicalLink(): void {
    const link = this.#document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    link?.remove();
  }

  /** Injects hreflang alternate links for each supported locale and x-default. */
  #setAlternateLinks(routeKey: string): void {
    this.#removeAlternateLinks();

    const entry = ROUTE_MANIFEST.find((e) => e.key === routeKey);
    if (!entry) {
      return;
    }

    let defaultLocaleUrl = '';

    for (const l of LOCALES) {
      const url = toCanonicalUrl(entry.metadata[l].canonicalPath, environment.baseUrl);
      const link = this.#document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', l);
      link.setAttribute('href', url);
      this.#document.head.appendChild(link);

      if (l === DEFAULT_LOCALE) {
        defaultLocaleUrl = url;
      }
    }

    const xDefault = this.#document.createElement('link');
    xDefault.setAttribute('rel', 'alternate');
    xDefault.setAttribute('hreflang', 'x-default');
    xDefault.setAttribute('href', defaultLocaleUrl);
    this.#document.head.appendChild(xDefault);
  }

  /** Removes all hreflang alternate link elements. */
  #removeAlternateLinks(): void {
    const links = this.#document.querySelectorAll<HTMLLinkElement>(ALTERNATE_LINK_SELECTOR);
    links.forEach((link) => link.remove());
  }

  /** Creates or updates the JSON-LD Person script. */
  #setPersonJsonLd(person: Readonly<Record<string, unknown>>): void {
    this.#setJsonLd(PERSON_JSONLD_SELECTOR, 'person', person);
  }

  /** Creates or updates the JSON-LD Service script. */
  #setServiceJsonLd(service: Readonly<Record<string, unknown>>): void {
    this.#setJsonLd(SERVICE_JSONLD_SELECTOR, 'service', service);
  }

  /** Creates or updates a JSON-LD script using setAttribute for SSR/prerender compatibility. */
  #setJsonLd(
    selector: string,
    dataSeoValue: string,
    entity: Readonly<Record<string, unknown>>,
  ): void {
    let script = this.#document.querySelector<HTMLScriptElement>(selector);
    if (!script) {
      script = this.#document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo', dataSeoValue);
      this.#document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(entity);
  }
}

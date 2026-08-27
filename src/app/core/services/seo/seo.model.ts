export interface SeoMetadata {
  readonly title: string;
  readonly description: string;
  /**
   * Set on paid-ad landing pages so they stay out of organic search and do not
   * compete with the public service pages.
   */
  readonly noindex?: boolean;
}

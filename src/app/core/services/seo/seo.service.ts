import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SeoMetadata } from './seo.model';

@Injectable({ providedIn: 'root' })
export class SeoService {
  readonly #title = inject(Title);
  readonly #meta = inject(Meta);

  setTitle(title: string): void {
    this.#title.setTitle(title);
  }

  updateTag(tag: { name: string; content: string }): void {
    this.#meta.updateTag(tag);
  }

  setPageMetadata(config: SeoMetadata): void {
    this.setTitle(config.title);
    this.updateTag({ name: 'description', content: config.description });
    this.#setRobots(config.noindex === true);
  }

  /**
   * Robots is written on every call, not only when noindex is set, so navigating
   * from a noindexed landing page to an indexable page clears the directive
   * instead of leaving it stuck on.
   */
  #setRobots(noindex: boolean): void {
    this.updateTag({ name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' });
  }
}

import { DOCUMENT, Service, computed, effect, inject, signal } from '@angular/core';

import { Direction, LOCALE, Locale, directionFor } from '../locale';

/**
 * LangService — derives the active language and reading direction from
 * the injected `LOCALE` token and keeps document `lang`/`dir` in sync.
 */
@Service()
export class LangService {
  readonly #document = inject(DOCUMENT);
  readonly #locale = inject(LOCALE);

  readonly currentLang = signal<Locale>(this.#locale);
  readonly direction = computed<Direction>(() => directionFor(this.currentLang()));

  constructor() {
    effect(() => {
      const lang = this.currentLang();
      this.#applyDocumentDirection(lang, this.direction());
    });
  }

  #applyDocumentDirection(lang: Locale, dir: Direction) {
    const html = this.#document.documentElement;
    html.lang = lang;
    html.dir = dir;

    this.#document.body.classList.remove('rtl', 'ltr');
    this.#document.body.classList.add(dir);
  }
}

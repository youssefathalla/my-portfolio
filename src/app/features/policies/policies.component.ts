import { Component, OnInit, computed, inject } from '@angular/core';
import { LangService } from '@core/i18n/services/lang.service';
import { SeoService } from '@core/seo/seo.service';
import { LOCALE } from '@core/i18n/locale';
import { ROUTE_MANIFEST } from '@core/routing/route-manifest';
import { POLICIES_CONTENT } from './policies.content';

@Component({
  selector: 'app-policies',
  imports: [],
  templateUrl: './policies.component.html',
  host: {
    class: 'block',
  },
})
export class PoliciesComponent implements OnInit {
  readonly #lang = inject(LangService);
  readonly #seo = inject(SeoService);
  readonly #locale = inject(LOCALE);

  protected readonly t = computed(() => POLICIES_CONTENT[this.#lang.currentLang()]);

  ngOnInit(): void {
    const entry = ROUTE_MANIFEST.find((e) => e.key === 'policies');
    if (entry) {
      this.#seo.initRoute(entry.metadata[this.#locale], 'policies', this.#locale);
    }
  }
}

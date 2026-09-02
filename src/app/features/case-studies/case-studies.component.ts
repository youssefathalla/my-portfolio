import { Component, OnInit, computed, inject } from '@angular/core';
import { LangService } from '@core/i18n/services/lang.service';
import { SeoService } from '@core/seo/seo.service';
import { LOCALE } from '@core/i18n/locale';
import { ROUTE_MANIFEST } from '@core/routing/route-manifest';
import { CASE_STUDIES_CONTENT } from './case-studies.content';

@Component({
  selector: 'app-case-studies',
  imports: [],
  templateUrl: './case-studies.component.html',
  host: {
    class: 'block',
  },
})
export class CaseStudiesComponent implements OnInit {
  readonly #lang = inject(LangService);
  readonly #seo = inject(SeoService);
  readonly #locale = inject(LOCALE);

  protected readonly t = computed(() => CASE_STUDIES_CONTENT[this.#lang.currentLang()]);

  ngOnInit(): void {
    const entry = ROUTE_MANIFEST.find((e) => e.key === 'case-studies');
    if (entry) {
      this.#seo.initRoute(entry.metadata[this.#locale], 'case-studies', this.#locale);
    }
  }
}

import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '@core/i18n/services/lang.service';
import { SeoService } from '@core/seo/seo.service';
import { LOCALE } from '@core/i18n/locale';
import { ROUTE_MANIFEST } from '@core/routing/route-manifest';
import { SERVICES_CONTENT } from './services.content';

@Component({
  selector: 'app-services',
  imports: [RouterLink],
  templateUrl: './services.component.html',
  host: {
    class: 'block',
  },
})
export class ServicesComponent implements OnInit {
  readonly #lang = inject(LangService);
  readonly #seo = inject(SeoService);
  readonly #locale = inject(LOCALE);

  protected readonly t = computed(() => SERVICES_CONTENT[this.#lang.currentLang()]);

  ngOnInit(): void {
    const entry = ROUTE_MANIFEST.find((e) => e.key === 'services-hub');
    if (entry) {
      this.#seo.initRoute(entry.metadata[this.#locale], 'services-hub', this.#locale);
    }
  }
}

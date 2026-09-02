import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LangService } from '@core/i18n/services/lang.service';
import { SeoService, type ServiceJsonLd } from '@core/seo/seo.service';
import { LOCALE } from '@core/i18n/locale';
import { ROUTE_MANIFEST } from '@core/routing/route-manifest';
import { FIXED_MVP_CONTENT } from './fixed-mvp.content';

@Component({
  selector: 'app-fixed-mvp',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './fixed-mvp.component.html',
  host: {
    class: 'block',
  },
})
export class FixedMvpComponent implements OnInit {
  readonly #lang = inject(LangService);
  readonly #seo = inject(SeoService);
  readonly #locale = inject(LOCALE);

  protected readonly t = computed(() => FIXED_MVP_CONTENT[this.#lang.currentLang()]);

  ngOnInit(): void {
    const entry = ROUTE_MANIFEST.find((e) => e.key === 'turnkey');
    if (entry) {
      const meta = entry.metadata[this.#locale];
      const service: ServiceJsonLd = {
        name: meta.title,
        description: meta.description,
        serviceType: 'Fixed-Price MVP Web Application Development',
      };
      this.#seo.initServiceRoute(meta, 'turnkey', this.#locale, service);
    }
  }
}

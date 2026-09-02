import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LangService } from '@core/i18n/services/lang.service';
import { SeoService, type ServiceJsonLd } from '@core/seo/seo.service';
import { LOCALE } from '@core/i18n/locale';
import { ROUTE_MANIFEST } from '@core/routing/route-manifest';
import { HOURLY_SPRINTS_CONTENT } from './hourly-sprints.content';

@Component({
  selector: 'app-hourly-sprints',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './hourly-sprints.component.html',
  host: {
    class: 'block',
  },
})
export class HourlySprintsComponent implements OnInit {
  readonly #lang = inject(LangService);
  readonly #seo = inject(SeoService);
  readonly #locale = inject(LOCALE);

  protected readonly t = computed(() => HOURLY_SPRINTS_CONTENT[this.#lang.currentLang()]);

  ngOnInit(): void {
    const entry = ROUTE_MANIFEST.find((e) => e.key === 'sprints');
    if (entry) {
      const meta = entry.metadata[this.#locale];
      const service: ServiceJsonLd = {
        name: meta.title,
        description: meta.description,
        serviceType: 'Hourly Front-End Engineering Sprints',
      };
      this.#seo.initServiceRoute(meta, 'sprints', this.#locale, service);
    }
  }
}

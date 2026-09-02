import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LangService } from '@core/i18n/services/lang.service';
import { SeoService, type ServiceJsonLd } from '@core/seo/seo.service';
import { LOCALE } from '@core/i18n/locale';
import { ROUTE_MANIFEST } from '@core/routing/route-manifest';
import { TACTICAL_AUDITS_CONTENT } from './tactical-audits.content';

@Component({
  selector: 'app-tactical-audits',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './tactical-audits.component.html',
  host: {
    class: 'block',
  },
})
export class TacticalAuditsComponent implements OnInit {
  readonly #lang = inject(LangService);
  readonly #seo = inject(SeoService);
  readonly #locale = inject(LOCALE);

  protected readonly t = computed(() => TACTICAL_AUDITS_CONTENT[this.#lang.currentLang()]);

  ngOnInit(): void {
    const entry = ROUTE_MANIFEST.find((e) => e.key === 'audits');
    if (entry) {
      const meta = entry.metadata[this.#locale];
      const service: ServiceJsonLd = {
        name: meta.title,
        description: meta.description,
        serviceType: 'Tactical Front-End Engineering Audits',
      };
      this.#seo.initServiceRoute(meta, 'audits', this.#locale, service);
    }
  }
}

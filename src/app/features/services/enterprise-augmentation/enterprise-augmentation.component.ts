import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LangService } from '@core/i18n/services/lang.service';
import { SeoService, type ServiceJsonLd } from '@core/seo/seo.service';
import { LOCALE } from '@core/i18n/locale';
import { ROUTE_MANIFEST } from '@core/routing/route-manifest';
import { ENTERPRISE_AUGMENTATION_CONTENT } from './enterprise-augmentation.content';

@Component({
  selector: 'app-enterprise-augmentation',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './enterprise-augmentation.component.html',
  host: {
    class: 'block',
  },
})
export class EnterpriseAugmentationComponent implements OnInit {
  readonly #lang = inject(LangService);
  readonly #seo = inject(SeoService);
  readonly #locale = inject(LOCALE);

  protected readonly t = computed(() => ENTERPRISE_AUGMENTATION_CONTENT[this.#lang.currentLang()]);

  ngOnInit(): void {
    const entry = ROUTE_MANIFEST.find((e) => e.key === 'augmentation');
    if (entry) {
      const meta = entry.metadata[this.#locale];
      const service: ServiceJsonLd = {
        name: meta.title,
        description: meta.description,
        serviceType: 'Enterprise Front-End Augmentation',
      };
      this.#seo.initServiceRoute(meta, 'augmentation', this.#locale, service);
    }
  }
}

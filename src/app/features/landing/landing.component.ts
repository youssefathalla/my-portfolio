import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LangService } from '@core/i18n/services/lang.service';
import { SeoService } from '@core/seo/seo.service';
import { LOCALE } from '@core/i18n/locale';
import { LANDING_CONTENT } from './landing.content';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './landing.component.html',
  host: {
    class: 'block',
  },
})
export class LandingComponent implements OnInit {
  readonly #lang = inject(LangService);
  readonly #seo = inject(SeoService);
  readonly #locale = inject(LOCALE);

  protected readonly t = computed(() => LANDING_CONTENT[this.#lang.currentLang()]);

  ngOnInit(): void {
    this.#seo.initLanding(this.#locale);
  }
}

import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '@core/i18n/services/lang.service';
import { SITE_FOOTER_CONTENT } from './site-footer.content';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.component.html',
  host: {
    class: 'block',
  },
})
export class SiteFooterComponent {
  readonly #lang = inject(LangService);

  protected readonly t = computed(() => SITE_FOOTER_CONTENT[this.#lang.currentLang()]);
}

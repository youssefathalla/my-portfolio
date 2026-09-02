import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LangService } from '@core/i18n/services/lang.service';
import { LangComponent } from '@core/i18n/components/lang.component';
import { SITE_NAV_CONTENT } from './site-nav.content';

@Component({
  selector: 'app-site-nav',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, LangComponent],
  templateUrl: './site-nav.component.html',
  host: {
    class: 'block',
  },
})
export class SiteNavComponent {
  readonly #lang = inject(LangService);

  protected readonly t = computed(() => SITE_NAV_CONTENT[this.#lang.currentLang()]);
}

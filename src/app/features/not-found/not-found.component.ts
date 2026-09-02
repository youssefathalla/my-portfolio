import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LangService } from '@core/i18n/services/lang.service';
import { SeoService } from '@core/seo/seo.service';
import { NOT_FOUND_CONTENT } from './not-found.content';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule],
  template: `
    <main class="min-h-[60vh] flex items-center justify-center p-8">
      <div class="text-center space-y-6 max-w-md">
        <div class="text-6xl font-extrabold text-primary font-mono">404</div>
        <h1 class="text-2xl md:text-3xl font-bold">{{ t().title }}</h1>
        <p class="text-muted-foreground">{{ t().description }}</p>
        <div class="flex items-center justify-center gap-4 pt-4">
          <a routerLink="/" mat-flat-button>{{ t().homeCta }}</a>
          <a routerLink="/services" mat-stroked-button>{{ t().servicesCta }}</a>
        </div>
      </div>
    </main>
  `,
  host: {
    class: 'block',
  },
})
export class NotFoundComponent {
  readonly #lang = inject(LangService);

  protected readonly t = computed(() => NOT_FOUND_CONTENT[this.#lang.currentLang()]);

  constructor() {
    inject(SeoService).initNotFound(this.t().title);
  }
}

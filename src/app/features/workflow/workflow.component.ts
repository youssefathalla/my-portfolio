import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LangService } from '@core/i18n/services/lang.service';
import { SeoService } from '@core/seo/seo.service';
import { LOCALE } from '@core/i18n/locale';
import { ROUTE_MANIFEST } from '@core/routing/route-manifest';
import { WORKFLOW_CONTENT } from './workflow.content';

@Component({
  selector: 'app-workflow',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './workflow.component.html',
  host: {
    class: 'block',
  },
})
export class WorkflowComponent implements OnInit {
  readonly #lang = inject(LangService);
  readonly #seo = inject(SeoService);
  readonly #locale = inject(LOCALE);

  protected readonly t = computed(() => WORKFLOW_CONTENT[this.#lang.currentLang()]);

  ngOnInit(): void {
    const entry = ROUTE_MANIFEST.find((e) => e.key === 'workflow');
    if (entry) {
      this.#seo.initRoute(entry.metadata[this.#locale], 'workflow', this.#locale);
    }
  }
}

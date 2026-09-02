import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink } from '@angular/router';

import { LOCALE } from '../locale';
import { normalizeActivePath } from '../../routing/active-path';
import { ROUTE_MANIFEST, resolveLanguageSwitcherTargets } from '../../routing/route-manifest';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { LANG_CONTENT } from './lang.content';

@Component({
  selector: 'app-lang',
  imports: [MatButtonModule, MatMenuModule, SharedIconModule, RouterLink],
  templateUrl: './lang.component.html',
  host: {
    class: 'inline-block',
  },
})
export class LangComponent {
  readonly #router = inject(Router);
  readonly #locale = inject(LOCALE);

  protected readonly content = computed(() => LANG_CONTENT[this.#locale]);

  protected readonly targets = computed(() =>
    resolveLanguageSwitcherTargets(ROUTE_MANIFEST, normalizeActivePath(this.#router.url), this.#locale),
  );
}

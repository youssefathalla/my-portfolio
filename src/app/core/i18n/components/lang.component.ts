import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { LangService } from '@core/i18n/services/lang.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { SupportedLanguage } from '../transloco.config';
import { SharedIconModule } from '@shared/ui/mat-icon';

@Component({
  selector: 'app-lang',
  imports: [MatButtonModule, MatMenuModule, SharedIconModule, TranslocoPipe],
  templateUrl: './lang.component.html',
  host: {
    class: 'inline-block',
  },
})
export class LangComponent {
  readonly #languageService = inject(LangService);

  switchLanguage(lang: SupportedLanguage) {
    this.#languageService.setLanguage(lang);
  }
}

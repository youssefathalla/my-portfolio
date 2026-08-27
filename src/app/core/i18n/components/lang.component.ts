import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { LangService } from '@core/i18n/services/lang.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { SupportedLanguage } from "../transloco.config";

@Component({
  selector: 'app-lang',
  imports: [MatButtonModule, MatMenuModule, MatIconModule, TranslocoPipe],
  templateUrl: './lang.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block',
  },
})
export class LangComponent {
  private readonly languageService = inject(LangService);

  switchLanguage(lang: SupportedLanguage) {
    this.languageService.setLanguage(lang);
  }
}

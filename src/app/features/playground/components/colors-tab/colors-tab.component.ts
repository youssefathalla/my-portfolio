import { Component, inject } from '@angular/core';
import { SnackbarService } from '@core/services/snack-bar/snack-bar.service';
import { SharedIconModule } from '@shared/ui/mat-icon';

@Component({
  selector: 'app-colors-tab',
  templateUrl: './colors-tab.component.html',
  imports: [SharedIconModule],
})
export class ColorsTabComponent {
  readonly #snackbarService = inject(SnackbarService);

  protected copyToken(tokenName: string, label = ''): void {
    navigator.clipboard.writeText(tokenName).then(
      () => {
        const text = label ? `${label} (${tokenName})` : tokenName;
        this.#snackbarService.success(`Copied "${text}" to clipboard!`);
      },
      () => {
        this.#snackbarService.info(`Token: ${tokenName}`);
      },
    );
  }
}

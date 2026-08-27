import { Service, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Service()
export class SnackbarService {
  readonly #snackBar = inject(MatSnackBar);

  success(messageKey: string, actionKey = 'Close', duration = 3000) {
    this.#show(messageKey, actionKey, 'success-snackbar', duration);
  }

  error(messageKey: string, actionKey = 'Close', duration = 5000) {
    this.#show(messageKey, actionKey, 'error-snackbar', duration);
  }

  warning(messageKey: string, actionKey = 'Close', duration = 4000) {
    this.#show(messageKey, actionKey, 'warning-snackbar', duration);
  }

  info(messageKey: string, actionKey = 'Close', duration = 3000) {
    this.#show(messageKey, actionKey, 'info-snackbar', duration);
  }

  #show(messageKey: string, actionKey: string, panelClass: string, duration: number) {
    this.#snackBar.open(messageKey, actionKey, {
      panelClass: [panelClass],
      duration,
    });
  }
}

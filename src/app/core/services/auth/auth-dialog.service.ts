import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthDialogService {
  readonly #dialog = inject(MatDialog);

  /**
   * Lazily loads the LoginDialogComponent and opens it.
   * @param contextMessage Optional message explaining why login is needed (shown inside the dialog).
   * @returns `true` if the user logged in successfully, `false` if they dismissed the dialog.
   */
  async openLoginDialog(contextMessage?: string): Promise<boolean> {
    const { LoginDialogComponent } = await import('@features/auth/login-dialog/login-dialog.component');

    const dialogRef = this.#dialog.open(LoginDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      autoFocus: true,
      disableClose: true,
      backdropClass: 'login-dialog-backdrop',
      data: { contextMessage },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    return !!result;
  }
}

/**
 * openAdminConfirm (admin-dashboard R9.3, R10.5, R12.3).
 *
 * Opens the shared `ConfirmDialogComponent` (`src/app/shared/ui/dialogs/confirm-dialog/`)
 * and resolves to `true` on confirm, `false` on cancel or backdrop dismiss. Used by:
 * - SubmissionsListPage for the bulk archive confirmation (R9.3)
 * - ExportService for the >1000 document warning (R10.5)
 * - SubmissionDetailPage for status change confirmation (R12.3)
 *
 * Substituted for the admin-local `ConfirmDialog` in Task 6.7 (R11.27) — both declared
 * the same `app-confirm-dialog` selector, so the shared component wins.
 */
import type { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
} from '@shared/ui/dialogs/confirm-dialog/confirm-dialog.component';

/** Opens the shared confirm dialog with the given message and resolves to the user's choice. */
export function openAdminConfirm(dialog: MatDialog, message: string): Promise<boolean> {
  return firstValueFrom(
    dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: { title: 'Confirm', message, confirmText: 'Confirm', cancelText: 'Cancel' },
      })
      .afterClosed(),
  ).then((result) => result === true);
}

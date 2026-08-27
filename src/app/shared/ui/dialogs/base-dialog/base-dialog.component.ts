import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-base-dialog',
  imports: [MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col gap-2 min-w-[400px] max-w-[90vw]',
  },
  template: `
    <!-- Header -->
    <header mat-dialog-title class="flex items-center gap-3 px-6 py-4 mat-border-subtle border-b!">
      <ng-content select="[header]" />
    </header>

    <!-- Main Content -->
    <main mat-dialog-content class="flex-1 p-6! overflow-y-auto">
      <ng-content />
    </main>

    <!-- Footer -->
    <footer mat-dialog-actions class="elements-end gap-2 px-6 py-4 mat-border-subtle border-t!">
      <ng-content select="[footer]" />
    </footer>
  `,
})
export class BaseDialogComponent {}

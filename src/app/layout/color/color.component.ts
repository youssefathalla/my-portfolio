import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SnackbarService } from '@core/services/snack-bar/snack-bar.service';
import { StatusConfig } from "@shared/ui/status-badge/status-model";
import { StatusBadgeComponent } from "@shared/ui/status-badge/status-badge.component";

@Component({
  selector: 'app-color',
  imports: [MatIconModule, MatButtonModule, MatCheckboxModule, StatusBadgeComponent],
  templateUrl: './color.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorComponent {
  readonly #snackbarService = inject(SnackbarService);

   readonly statusConfig: Record<string, StatusConfig> = {
    high: { color: 'green', icon: 'home' },
    medium: { color: 'yellow', icon: 'check' },
    low: { color: 'blue', icon: 'warning' },
    critical: { color: 'red', icon: 'error' },
    normal: { color: 'gray', icon: 'info' },
  };

  showSnackBar(message: string, panelClass: string) {
    if (panelClass.includes('error')) {
      this.#snackbarService.error(message);
    } else if (panelClass.includes('success')) {
      this.#snackbarService.success(message);
    } else if (panelClass.includes('warning')) {
      this.#snackbarService.warning(message);
    } else {
      this.#snackbarService.info(message);
    }
  }
}

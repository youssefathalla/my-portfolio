import { Component, signal } from '@angular/core';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { StatusBadgeComponent } from '@shared/ui/status-badge/status-badge.component';
import { StatusConfig } from '@shared/ui/status-badge/status.model';
import { ChipsComponent } from '@shared/ui/chips/chips.component';

@Component({
  selector: 'app-badges-tab',
  imports: [SharedIconModule, StatusBadgeComponent, ChipsComponent],
  templateUrl: './badges-tab.component.html',
})
export class BadgesTabComponent {
  protected readonly availableChips = signal([
    'All Services',
    'Residential',
    'Commercial',
    'Storage',
    'Packing',
    'Express',
  ]);
  protected readonly selectedChip = signal('Residential');

  protected readonly statusConfig: Record<string, StatusConfig> = {
    high: { color: 'green', icon: 'check_circle' },
    medium: { color: 'yellow', icon: 'schedule' },
    low: { color: 'blue', icon: 'info' },
    critical: { color: 'red', icon: 'warning' },
    normal: { color: 'gray', icon: 'help_outline' },
    active: { color: 'green', icon: 'verified' },
    pending: { color: 'yellow', icon: 'hourglass_empty' },
    rejected: { color: 'red', icon: 'cancel' },
    completed: { color: 'green', icon: 'task_alt' },
  };
}

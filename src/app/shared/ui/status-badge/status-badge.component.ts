import { Component, computed, input } from '@angular/core';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { TitleCasePipe } from '@angular/common';
import { StatusConfig } from './status.model';

@Component({
  selector: 'app-status-badge',
  imports: [SharedIconModule, TitleCasePipe],
  host: {
    '[attr.status]': 'visualConfig().color',
    '[style.--bg-opacity]': 'bgOpacity()',
    class: 'status-badge',
  },
  template: `
    @if (visualConfig().icon; as iconName) {
      <mat-icon [name]="iconName" size="base" weight="700" />
    }
    @if (visualConfig().label; as labelText) {
      <span>{{ labelText }}</span>
    } @else if (valueString()) {
      <span>{{ valueString() | titlecase }}</span>
    } @else {
      <ng-content />
    }
  `,
})
export class StatusBadgeComponent<T> {
  readonly value = input.required<T>();
  readonly statusConfig = input<Record<string, StatusConfig>>();
  readonly icon = input<string>();
  readonly bgOpacity = input<number>();

  readonly valueString = computed(() => String(this.value()));

  readonly visualConfig = computed((): StatusConfig => {
    const key = this.valueString().toLowerCase();
    const config = this.statusConfig()?.[key];

    return {
      label: config?.label,
      icon: this.icon() ?? config?.icon,
      color: config?.color ?? 'primary',
    };
  });
}

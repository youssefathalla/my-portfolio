import { Directive, input, computed } from '@angular/core';
import { IconType, IconSize, ICON_SIZE_CLASSES, Weight, IconColor } from './mat-icon.model';

@Directive({
  selector: 'mat-icon[size], mat-icon[type], mat-icon[name], mat-icon[color]',
  host: {
    class: 'shrink-0',
    '[class]': 'hostClasses()',
    '[textContent]': 'name()',
    '[style.font-weight]': 'weight()',
    '[attr.iconColor]': 'iconColor()',
  },
})
export class MatIconDirective {
  readonly name = input.required<string>();
  readonly type = input<IconType>('outline');
  readonly size = input<IconSize>('2xl');
  readonly weight = input<Weight>('500');
  readonly iconColor = input<IconColor>();

  readonly hostClasses = computed(() => {
    const classes: string[] = [];

    if (this.type() === 'fill') classes.push('ms-fill');

    const currentSize = this.size();
    if (currentSize) classes.push(ICON_SIZE_CLASSES[currentSize]);

    return classes.join(' ');
  });
}

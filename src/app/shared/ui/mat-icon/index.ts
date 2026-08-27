import { MatIconModule } from '@angular/material/icon';
import { MatIconDirective } from './mat-icon.directive';

export const SharedIconModule = [MatIconModule, MatIconDirective] as const;

export { MatIconDirective } from './mat-icon.directive';
export { MatIconModule } from '@angular/material/icon';
export type { IconType, IconSize, Weight, IconColor } from './mat-icon.model';

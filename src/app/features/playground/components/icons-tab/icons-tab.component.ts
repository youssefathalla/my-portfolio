import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SharedIconModule, IconSize, IconColor } from '@shared/ui/mat-icon';

export interface IconSizeOption {
  key: IconSize;
  label: string;
  isDefault?: boolean;
}

@Component({
  selector: 'app-icons-tab',
  imports: [FormsModule, MatButtonModule, SharedIconModule],
  templateUrl: './icons-tab.component.html',
})
export class IconsTabComponent {
  protected readonly customIconName = signal('favorite');
  protected readonly customIconSize = signal<IconSize>('3xl');
  protected readonly customIconColor = signal<IconColor>('primary');
  protected readonly customIconType = signal<'outline' | 'fill'>('fill');

  protected readonly iconSizes: readonly IconSizeOption[] = [
    { key: 'xs', label: 'xs (12px)' },
    { key: 'sm', label: 'sm (14px)' },
    { key: 'base', label: 'base (16px)' },
    { key: 'lg', label: 'lg (18px)' },
    { key: 'xl', label: 'xl (20px)' },
    { key: '2xl', label: '2xl (Default)', isDefault: true },
    { key: '3xl', label: '3xl (30px)' },
    { key: '4xl', label: '4xl (36px)' },
    { key: '5xl', label: '5xl (48px)' },
    { key: '6xl', label: '6xl (60px)' },
    { key: '7xl', label: '7xl (72px)' },
  ];
}

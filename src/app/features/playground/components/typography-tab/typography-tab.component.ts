import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { FONTS_TO_TEST, TestableFont } from './typography-fonts.config';

export type FontScope = 'all' | 'numbers';

@Component({
  selector: 'app-typography-tab',
  imports: [SharedIconModule, FormsModule],
  templateUrl: './typography-tab.component.html',
})
export class TypographyTabComponent {
  protected readonly fonts = FONTS_TO_TEST;

  protected readonly weightOptions: readonly number[] = [300, 400, 500, 600, 700, 800, 900];

  protected readonly activeFontId = signal<string>('melodrama');
  protected readonly activeWeight = signal<number>(700);
  protected readonly targetScope = signal<FontScope>('all');
  protected readonly customSample = signal<string>('100% Growth in 60 Days — $45,000 ARR');

  protected readonly activeFont = computed<TestableFont>(
    () => this.fonts.find((f) => f.id === this.activeFontId()) ?? this.fonts[0],
  );

  protected readonly containerStyles = computed<Record<string, string>>(() => {
    const font = this.activeFont();
    const weight = this.activeWeight().toString();
    const scope = this.targetScope();

    const styles: Record<string, string> = {
      '--font-numeric-override': font.family,
      '--font-numeric-weight-override': weight,
    };

    if (scope === 'all') {
      styles['--font-active-preview'] = font.family;
    }

    return styles;
  });

  protected readonly scope = computed<FontScope>(() => this.targetScope());

  protected selectFont(font: TestableFont): void {
    this.activeFontId.set(font.id);
    this.activeWeight.set(font.defaultWeight);
  }

  protected setFont(id: string): void {
    const font = this.fonts.find((f) => f.id === id);
    if (font) {
      this.selectFont(font);
    }
  }

  protected selectWeight(weight: number): void {
    this.activeWeight.set(weight);
  }

  protected setWeight(weight: number): void {
    this.selectWeight(weight);
  }

  protected selectScope(scope: FontScope): void {
    this.targetScope.set(scope);
  }

  protected setScope(scope: FontScope): void {
    this.selectScope(scope);
  }
}

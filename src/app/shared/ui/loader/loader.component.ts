import { Component, computed, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderHeight, LOADER_HEIGHT_CLASSES, LOADER_HEIGHT_CLASSES_PADDED } from './loader.model';

@Component({
  selector: 'app-loader',
  imports: [MatProgressSpinnerModule],
  templateUrl: './loader.component.html',
  host: { '[class]': 'hostClass() + " " + bgClass() + " " + heightClass()' },
})
export class LoaderComponent {
  /** Spinner diameter in pixels (default: 100). */
  readonly diameter = input<number>(100);

  /** Loading text message (default: 'Loading...'). */
  readonly message = input<string>('Loading...');

  /** Whether to display the text message (default: true). */
  readonly showMessage = input<boolean>(true);

  /** Applies section-space padding class (default: true). */
  readonly sectionSpace = input<boolean>(true);

  /** Background color token name (default: 'surface'). */
  readonly bg = input<string>('surface');

  /** Minimum height preset key (default: '40'). */
  readonly minHeight = input<LoaderHeight>('40');
  protected readonly bgClass = computed(() => `bg-${this.bg()}`);
  protected readonly heightClass = computed(() => {
    const height = this.minHeight();
    const map = this.sectionSpace() ? LOADER_HEIGHT_CLASSES_PADDED : LOADER_HEIGHT_CLASSES;
    return map[height];
  });
  protected readonly hostClass = computed(() =>
    this.sectionSpace() ? 'loading-overlay section-space' : 'loading-overlay',
  );
}

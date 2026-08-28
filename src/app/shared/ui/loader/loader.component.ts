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
  /**
   * @param diameter - default value is 100
   * we can add any number values to diameter
   * example: diameter="100" or diameter="50" etc.
   */
  readonly diameter = input<number>(100);

  /**
   * @param message - default value is 'Loading...'
   */
  readonly message = input<string>('Loading...');

  /**
   * @param showMessage - default value is true
   */
  readonly showMessage = input<boolean>(true);

  /**
   * @param sectionSpace - default value is true
   * Controls whether to apply section-space padding class
   */
  readonly sectionSpace = input<boolean>(true);

  /**
   * @param bg - default value is 'surface'
   * we can add any tailwind class values to bg
   * example: bg="surface" or bg="primary" etc.
   */
  readonly bg = input<string>('surface');

  /**
   * @param minHeight - default value is '40'
   * Accepts predefined height values: '10' | '20' | '30' | '40' | '50' | '60' | '70' | '80' | '90' | 'full'
   */
  readonly minHeight = input<LoaderHeight>('40');

  //! Computed
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

import { Component, computed, input } from '@angular/core';
import { SpacingScale, GAP_SCALE, PADDING_SCALE } from './scale.model';

/**
 * A flexible card container component that provides structured layout through content projection.
 *
 * @content [card-header] - Content displayed at the top section of the card.
 * @content [card-content] - The primary content area of the card.
 * @content [card-sub-content] - Secondary or metadata content.
 * @content [card-footer] - Actions or summary content at the bottom.
 *
 * @input gap - The vertical spacing between projected content slots (SpacingScale).
 * @input contentGap - The vertical spacing between the primary and the secondary content (SpacingScale).
 * @input padding - The internal padding of the card container (SpacingScale).
 */
@Component({
  selector: 'app-base-card',
  imports: [],
  host: { class: 'base-card' },
  template: `
    <article class="flex flex-col h-full bg-surface-container-low overflow-auto" [class]="classes()">
      <header class="empty:hidden">
        <ng-content select="[card-header]" />
      </header>

      <div class="flex flex-col flex-1 empty:hidden" [class]="contentGapScale()">
        <ng-content select="[card-content]" />
        <ng-content select="[card-sub-content]" />
      </div>

      <footer class="empty:hidden">
        <ng-content select="[card-footer]" />
      </footer>
    </article>
  `,
})
export class BaseCardComponent {
  readonly gap = input<SpacingScale>('4');
  readonly contentGap = input<SpacingScale>('4');
  readonly padding = input<SpacingScale>('6');

  protected readonly contentGapScale = computed(() => `${GAP_SCALE[this.contentGap()]}`);
  protected readonly classes = computed(() => `${GAP_SCALE[this.gap()]} ${PADDING_SCALE[this.padding()]}`);
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BaseCardComponent } from '../base-card/base-card.component';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { StatusBadgeComponent } from '@shared/ui/status-badge/status-badge.component';
import { Review } from './review.model';

@Component({
  selector: 'app-review-card',
  imports: [BaseCardComponent, SharedIconModule, StatusBadgeComponent],
  templateUrl: './review-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewCardComponent {
  readonly review = input.required<Review>();

  readonly initials = computed(() => {
    const r = this.review();
    return r.firstName.charAt(0).toUpperCase() + r.lastName.charAt(0).toUpperCase();
  });

  readonly #starsCount = computed(() => this.review().stars);
  readonly starsArray = computed(() => Array.from({ length: this.#starsCount() }, (_, i) => i));
}

/**
 * Overview_Page (admin-dashboard R6).
 *
 * Displays four Count_Cards driven by `OverviewCountsService` signals:
 * Total, Unread, In Progress, and This Week. Each card independently
 * renders one of three states: loading (skeleton), ready (value), or
 * error (message + retry). An empty-state message appears when the
 * total count is zero (R6.2).
 *
 * Layout: responsive CSS grid — 4 columns above 1200px, 2 columns
 * between 768–1200px (R6.6).
 */

import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { SeoService } from '@core/seo/seo.service';
import { ADMIN_CONTENT } from '../../content/admin.content';
import { ADMIN_ICON_GLYPH, type AdminIconName } from '../../shared/admin-icon';
import { SharedIconModule } from '@shared/ui/mat-icon';
import {
  OverviewCountsService,
  type CountKey,
  type CountState,
} from '../../data/overview-counts.service';

/** Descriptor for each count card. */
interface CardDescriptor {
  readonly key: CountKey;
  readonly label: string;
  readonly icon: AdminIconName;
}

@Component({
  selector: 'app-overview-page',
  imports: [MatButtonModule, SharedIconModule],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.scss',
})
export class OverviewPage implements OnInit {
  protected readonly counts = inject(OverviewCountsService);

  /** Icon glyph lookup exposed to the template for card icons (R11.15). */
  protected readonly ADMIN_ICON_GLYPH = ADMIN_ICON_GLYPH;

  /** Static card descriptors paired with their service signals. */
  protected readonly cards: readonly CardDescriptor[] = [
    { key: 'total', label: 'Total', icon: 'inventory' },
    { key: 'unread', label: 'Unread', icon: 'mark-email-unread' },
    { key: 'inProgress', label: 'In Progress', icon: 'pending-actions' },
    { key: 'thisWeek', label: 'This Week', icon: 'date-range' },
  ];

  /** Empty-state message from admin content (R6.2). */
  protected readonly emptyMessage = ADMIN_CONTENT.overviewEmpty;

  constructor() {
    inject(SeoService).initExcludedRoute(ADMIN_CONTENT.overviewTitle, 'noindex, nofollow'); // R3.6
  }

  ngOnInit(): void {
    this.#initCounts();
  }

  #initCounts(): void {
    void this.counts.init();
  }

  /** Returns the CountState signal value for a given card key. */
  protected getState(key: CountKey): CountState {
    return this.counts[key]();
  }

  /** Returns the count value for a ready card, or 0 as fallback. */
  protected getValue(key: CountKey): number {
    const state = this.counts[key]();
    return state.kind === 'ready' ? state.value : 0;
  }

  /** Whether the total count is ready and zero (R6.2). */
  protected get isEmpty(): boolean {
    const state = this.counts.total();
    return state.kind === 'ready' && state.value === 0;
  }

  /** Retries loading for a specific card (R6.5). */
  protected retry(key: CountKey): void {
    this.counts.refresh(key);
  }
}

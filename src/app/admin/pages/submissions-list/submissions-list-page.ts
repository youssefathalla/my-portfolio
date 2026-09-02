/**
 * Submissions_List_Page (admin-dashboard R8, R9, R10.1, R3.6).
 *
 * The most complex page in the admin dashboard, combining:
 * - A real-time MatTable with 7 columns (checkbox, type, status, name, email, date, read)
 * - MatSort on type, status, and date columns
 * - MatPaginator with cursor-based pagination
 * - A filter toolbar (type/status/tag MatSelect + debounced search)
 * - Bulk actions: archive (with ConfirmDialog) and mark-as-read
 * - Export menu (CSV / JSON) via ExportService
 * - Row click navigation to the detail page
 * - Unread styling, loading/empty states, and new-row highlight animation
 * - LiveAnnouncer for accessibility
 */

import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { SeoService } from '@core/seo/seo.service';
import { ADMIN_CONTENT } from '../../content/admin.content';
import { SubmissionsQueryService } from '../../data/submissions-query.service';
import { SubmissionMutationsService } from '../../data/submission-mutations.service';
import { ExportService, type ExportFormat } from '../../export/export.service';
import { openAdminConfirm } from '../../shared/confirm-dialog';
import { ADMIN_ICON_GLYPH, type AdminIconName } from '../../shared/admin-icon';
import { SharedIconModule } from '@shared/ui/mat-icon';
import {
  DEFAULT_FILTER_STATE,
  type FilterState,
  type SortDirection,
  type SortField,
  type SubmissionRecord,
  type SubmissionStatus,
  type SubmissionType,
} from '../../data/submission-record';

/** All submission type values for the type filter select. */
const ALL_TYPES: readonly SubmissionType[] = ['contact', 'intake-wizard', 'booking'];

/** All submission status values for the status filter select. */
const ALL_STATUSES: readonly SubmissionStatus[] = ['new', 'in-progress', 'archived', 'spam'];

@Component({
  selector: 'app-submissions-list-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressBarModule,
    MatChipsModule,
    SharedIconModule,
  ],
  templateUrl: './submissions-list-page.html',
  styleUrl: './submissions-list-page.scss',
})
export class SubmissionsListPage implements OnInit {
  /** Icon glyph lookup exposed to the template (R11.15). */
  protected readonly ADMIN_ICON_GLYPH = ADMIN_ICON_GLYPH;

  private readonly query = inject(SubmissionsQueryService);
  private readonly mutations = inject(SubmissionMutationsService);
  private readonly exportService = inject(ExportService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly destroyRef = inject(DestroyRef);

  // ─── Table columns (R8.1) ─────────────────────────────────────────────────

  protected readonly displayedColumns = [
    'select',
    'type',
    'status',
    'name',
    'email',
    'date',
    'read',
  ] as const;

  // ─── Filter options ───────────────────────────────────────────────────────

  protected readonly allTypes = ALL_TYPES;
  protected readonly allStatuses = ALL_STATUSES;

  /** Tag filter options derived from the loaded window (R8.4). */
  protected readonly tagOptions = computed(() =>
    [...new Set(this.query.visibleRecords().flatMap((r) => r.document.tags))].sort((a, b) =>
      a.localeCompare(b),
    ),
  );

  // ─── Filter controls ──────────────────────────────────────────────────────

  protected readonly typeFilter = new FormControl<SubmissionType[]>([], { nonNullable: true });
  protected readonly statusFilter = new FormControl<SubmissionStatus[]>([], { nonNullable: true });
  protected readonly tagFilter = new FormControl<string[]>([], { nonNullable: true });
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  // ─── Service-exposed signals ──────────────────────────────────────────────

  protected readonly rows = this.query.visibleRecords;
  protected readonly loading = this.query.loading;
  protected readonly disconnected = this.query.disconnected;
  protected readonly error = this.query.error;
  protected readonly totalCount = this.query.totalCount;
  protected readonly totalCountIsUpperBound = this.query.totalCountIsUpperBound;
  protected readonly hasNext = this.query.hasNext;
  protected readonly hasPrevious = this.query.hasPrevious;
  protected readonly recentlyAddedIds = this.query.recentlyAddedIds;
  protected readonly exporting = this.exportService.exporting;

  // ─── Selection (R9.1) ─────────────────────────────────────────────────────

  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());

  /** Whether all visible rows are selected (drives header checkbox state). */
  protected readonly allSelected = computed(() => {
    const rows = this.rows();
    const sel = this.selectedIds();
    return rows.length > 0 && rows.every((r) => sel.has(r.id));
  });

  /** Indeterminate: some but not all rows are selected. */
  protected readonly indeterminate = computed(() => {
    const sel = this.selectedIds();
    return sel.size > 0 && !this.allSelected();
  });

  /** Whether a bulk action is currently in flight (R9.7). */
  protected readonly bulkInFlight = signal(false);

  // ─── Pagination state for the paginator display ───────────────────────────

  protected readonly currentPageIndex = signal(0);

  /** Current page size read from the filter state. */
  protected readonly pageSize = computed(() => this.query.filterState().pageSize);

  /** Paginator aria-label, phrased with "About" when the total is an upper bound (R8.3, R8.11). */
  protected readonly paginatorAriaLabel = computed(() =>
    this.totalCountIsUpperBound()
      ? `About ${this.totalCount()} results`
      : `${this.totalCount()} results`,
  );

  // ─── Previous row count for LiveAnnouncer (R8.11) ─────────────────────────

  private previousRowCount = 0;

  constructor() {
    inject(SeoService).initExcludedRoute(ADMIN_CONTENT.submissionsListTitle, 'noindex, nofollow'); // R3.6

    // Announce result count changes (R8.11)
    effect(() => {
      const count = this.rows().length;
      if (this.previousRowCount !== count && this.previousRowCount !== 0) {
        void this.announcer.announce(`Showing ${count} submissions`);
      }
      this.previousRowCount = count;
    });
  }

  ngOnInit(): void {
    this.setupSearchDebounce();
  }

  // ─── Filter handling ──────────────────────────────────────────────────────

  /** Handle type filter change (R8.5). */
  protected onTypeFilterChange(types: SubmissionType[]): void {
    this.applyFilterChange({ types });
  }

  /** Handle status filter change (R8.5). */
  protected onStatusFilterChange(statuses: SubmissionStatus[]): void {
    this.applyFilterChange({ statuses });
  }

  /** Handle tag filter change (R8.5). */
  protected onTagFilterChange(tags: string[]): void {
    this.applyFilterChange({ tags });
  }

  /** Apply a partial filter change, resetting cursor and clearing selection (R8.5, R9.8). */
  private applyFilterChange(partial: Partial<FilterState>): void {
    const current = this.query.filterState();
    this.query.setFilter({ ...current, ...partial });
    this.clearSelection();
    this.currentPageIndex.set(0);
    void this.announcer.announce('Filters applied');
  }

  /** Set up search input debounce (R8.5 — 300ms debounce). */
  private setupSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => {
        this.applyFilterChange({ search });
      });
  }

  // ─── Sorting (R8.2) ───────────────────────────────────────────────────────

  protected onSortChange(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      // Reset to default sort
      this.applyFilterChange({
        sortField: DEFAULT_FILTER_STATE.sortField,
        sortDirection: DEFAULT_FILTER_STATE.sortDirection,
      });
      return;
    }

    const fieldMap: Record<string, SortField> = {
      type: 'status', // 'type' column sorts by type, mapped to createdAt since type isn't a SortField
      status: 'status',
      date: 'createdAt',
    };

    const sortField = fieldMap[sort.active] ?? 'createdAt';
    const sortDirection: SortDirection = sort.direction as SortDirection;
    this.applyFilterChange({ sortField, sortDirection });
  }

  // ─── Pagination (R8.3) ────────────────────────────────────────────────────

  protected onPageChange(event: PageEvent): void {
    // Page size changed
    if (event.pageSize !== this.pageSize()) {
      this.query.setPageSize(event.pageSize as 10 | 25 | 50);
      this.clearSelection();
      this.currentPageIndex.set(0);
      return;
    }

    // Navigate forward or backward
    if (event.pageIndex > this.currentPageIndex()) {
      this.query.nextPage();
      this.currentPageIndex.set(event.pageIndex);
    } else if (event.pageIndex < this.currentPageIndex()) {
      this.query.previousPage();
      this.currentPageIndex.set(event.pageIndex);
    }

    this.clearSelection(); // R9.8 — clear selection on page change
  }

  // ─── Selection (R9.1, R9.8) ───────────────────────────────────────────────

  /** Toggle header checkbox: select all or deselect all visible rows. */
  protected toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.rows().map((r) => r.id)));
    }
  }

  /** Toggle a single row's selection. */
  protected toggleRow(id: string): void {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  /** Whether a given row is selected. */
  protected isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  /** Clear the selection. */
  private clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // ─── Bulk actions (R9.3, R9.4, R9.5, R9.6, R9.7) ────────────────────────

  /** Archive selected submissions with confirmation (R9.3, R9.4). */
  protected async archiveSelected(): Promise<void> {
    const ids = [...this.selectedIds()];
    const count = ids.length;

    const confirmed = await openAdminConfirm(this.dialog, `Archive ${count} submissions?`);

    if (!confirmed) return;

    this.bulkInFlight.set(true);
    try {
      const outcome = await this.mutations.applyBulk(ids, { status: 'archived' });
      const successCount = outcome.succeededIds.length;
      const failCount = outcome.failedIds.length;

      if (failCount === 0) {
        this.snackBar.open(`${successCount} submissions archived`, undefined, { duration: 4000 });
      } else {
        this.snackBar.open(`${successCount} archived, ${failCount} failed`, undefined, {
          duration: 4000,
        });
      }

      // Clear only succeeded from selection (R9.6)
      const remaining = new Set(this.selectedIds());
      for (const id of outcome.succeededIds) {
        remaining.delete(id);
      }
      this.selectedIds.set(remaining);
    } finally {
      this.bulkInFlight.set(false);
    }
  }

  /** Mark selected submissions as read without confirmation (R9.5). */
  protected async markAsRead(): Promise<void> {
    const ids = [...this.selectedIds()];

    this.bulkInFlight.set(true);
    try {
      const outcome = await this.mutations.applyBulk(ids, { read: true });
      const successCount = outcome.succeededIds.length;
      const failCount = outcome.failedIds.length;

      if (failCount === 0) {
        this.snackBar.open(`${successCount} submissions marked as read`, undefined, {
          duration: 4000,
        });
      } else {
        this.snackBar.open(`${successCount} marked as read, ${failCount} failed`, undefined, {
          duration: 4000,
        });
      }

      // Clear only succeeded from selection (R9.6)
      const remaining = new Set(this.selectedIds());
      for (const id of outcome.succeededIds) {
        remaining.delete(id);
      }
      this.selectedIds.set(remaining);
    } finally {
      this.bulkInFlight.set(false);
    }
  }

  // ─── Export (R10.1) ───────────────────────────────────────────────────────

  protected exportAs(format: ExportFormat): void {
    void this.exportService.export(format, this.query.filterState());
  }

  // ─── Row navigation (R8.7) ────────────────────────────────────────────────

  protected navigateToDetail(record: SubmissionRecord): void {
    void this.router.navigate(['/admin/submissions', record.id]);
  }

  // ─── Row helpers ──────────────────────────────────────────────────────────

  /** Whether a row is unread (R8.6). */
  protected isUnread(record: SubmissionRecord): boolean {
    return !record.document.read;
  }

  /** Whether a row was recently added (R8.10). */
  protected isRecentlyAdded(id: string): boolean {
    return this.recentlyAddedIds().includes(id);
  }

  /** Get the icon for a submission type. */
  protected getTypeIcon(record: SubmissionRecord): AdminIconName {
    switch (record.document.type) {
      case 'contact':
        return 'mail';
      case 'intake-wizard':
        return 'assignment';
      case 'booking':
        return 'event';
      default:
        return 'description';
    }
  }

  /** Get the name from the payload, falling back to em-dash. */
  protected getName(record: SubmissionRecord): string {
    const payload = record.document.payload as Record<string, unknown>;
    return (payload?.['name'] as string) ?? '—';
  }

  /** Get the email from the payload, falling back to em-dash. */
  protected getEmail(record: SubmissionRecord): string {
    const payload = record.document.payload as Record<string, unknown>;
    return (payload?.['email'] as string) ?? '—';
  }

  /** Whether the current filter state is the default (no filters applied). */
  protected isDefaultFilter(): boolean {
    const f = this.query.filterState();
    return (
      f.types.length === 0 &&
      f.statuses.length === 0 &&
      f.tags.length === 0 &&
      f.search === ''
    );
  }
}

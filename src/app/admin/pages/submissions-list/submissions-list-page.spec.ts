import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTableHarness } from '@angular/material/table/testing';
import { MatSortHarness } from '@angular/material/sort/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { of } from 'rxjs';

import { SubmissionsListPage } from './submissions-list-page';
import { SubmissionsQueryService } from '../../data/submissions-query.service';
import { SubmissionMutationsService } from '../../data/submission-mutations.service';
import { ExportService } from '../../export/export.service';
import { ConfirmDialogComponent } from '@shared/ui/dialogs/confirm-dialog/confirm-dialog.component';
import { DEFAULT_FILTER_STATE, type SubmissionRecord } from '../../data/submission-record';

/**
 * Component Harness specs for SubmissionsListPage (admin-dashboard R8, R9,
 * R10.1, portfolio-merge R14.16, R14.17). `SubmissionsQueryService`,
 * `SubmissionMutationsService`, and `ExportService` are mocked at the
 * service boundary. Every async flow is awaited through
 * `fixture.whenStable()` — zero `fakeAsync`/`tick`.
 */
describe('SubmissionsListPage', () => {
  let fixture: ComponentFixture<SubmissionsListPage>;
  let rows: ReturnType<typeof signal<readonly SubmissionRecord[]>>;
  let filterState: ReturnType<typeof signal<typeof DEFAULT_FILTER_STATE>>;
  let queryMock: {
    visibleRecords: typeof rows;
    loading: ReturnType<typeof signal<boolean>>;
    disconnected: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<unknown>>;
    totalCount: ReturnType<typeof signal<number>>;
    totalCountIsUpperBound: ReturnType<typeof signal<boolean>>;
    hasNext: ReturnType<typeof signal<boolean>>;
    hasPrevious: ReturnType<typeof signal<boolean>>;
    recentlyAddedIds: ReturnType<typeof signal<readonly string[]>>;
    filterState: typeof filterState;
    setFilter: ReturnType<typeof vi.fn>;
    setPageSize: ReturnType<typeof vi.fn>;
    nextPage: ReturnType<typeof vi.fn>;
    previousPage: ReturnType<typeof vi.fn>;
  };
  let mutationsMock: { patch: ReturnType<typeof vi.fn>; applyBulk: ReturnType<typeof vi.fn> };
  let exportMock: {
    exporting: ReturnType<typeof signal<boolean>>;
    export: ReturnType<typeof vi.fn>;
  };

  function makeRecord(id: string, overrides: Partial<SubmissionRecord['document']> = {}): SubmissionRecord {
    return {
      id,
      document: {
        type: 'contact',
        status: 'new',
        createdAt: null,
        updatedAt: null,
        read: false,
        payload: { name: `Name ${id}`, email: `${id}@example.com` },
        notes: '',
        tags: [],
        ...overrides,
      },
      createdAtMs: 1_700_000_000_000,
      updatedAtMs: 1_700_000_000_000,
    };
  }

  async function createFixture(): Promise<void> {
    rows = signal<readonly SubmissionRecord[]>([makeRecord('1'), makeRecord('2')]);
    filterState = signal(DEFAULT_FILTER_STATE);

    queryMock = {
      visibleRecords: rows,
      loading: signal(false),
      disconnected: signal(false),
      error: signal(null),
      totalCount: signal(2),
      totalCountIsUpperBound: signal(false),
      hasNext: signal(false),
      hasPrevious: signal(false),
      recentlyAddedIds: signal<readonly string[]>([]),
      filterState,
      setFilter: vi.fn((next) => filterState.set(next)),
      setPageSize: vi.fn(),
      nextPage: vi.fn(),
      previousPage: vi.fn(),
    };

    mutationsMock = {
      patch: vi.fn().mockResolvedValue(undefined),
      applyBulk: vi.fn().mockResolvedValue({ succeededIds: [], failedIds: [] }),
    };

    exportMock = {
      exporting: signal(false),
      export: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SubmissionsListPage],
      providers: [
        provideRouter([]),
        { provide: SubmissionsQueryService, useValue: queryMock },
        { provide: SubmissionMutationsService, useValue: mutationsMock },
        { provide: ExportService, useValue: exportMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionsListPage);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('renders one table row per record in visibleRecords', async () => {
    await createFixture();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const table = await loader.getHarness(MatTableHarness);
    const tableRows = await table.getRows();

    expect(tableRows.length).toBe(2);
  });

  it('sort interaction on a header calls onSortChange, which resets the cursor and applies the new sort field', async () => {
    await createFixture();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const sort = await loader.getHarness(MatSortHarness);
    const headers = await sort.getSortHeaders({ label: 'Status' });
    expect(headers.length).toBe(1);

    await headers[0].click();
    await fixture.whenStable();

    expect(queryMock.setFilter).toHaveBeenCalledTimes(1);
    const applied = queryMock.setFilter.mock.calls[0][0];
    expect(applied.sortField).toBe('status');
  });

  it('a type-filter MatSelect interaction calls onTypeFilterChange (setFilter with the new types)', async () => {
    await createFixture();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    // The Type filter is the first of the three MatSelect instances in the filter toolbar
    // (Type, Status, Tags — in template order).
    const [typeFilterSelect] = await loader.getAllHarnesses(MatSelectHarness);
    await typeFilterSelect.open();
    await typeFilterSelect.clickOptions({ text: 'contact' });
    await fixture.whenStable();

    expect(queryMock.setFilter).toHaveBeenCalled();
    const applied = queryMock.setFilter.mock.calls.at(-1)?.[0];
    expect(applied.types).toEqual(['contact']);
  });

  it('the export menu opens and clicking "Export as CSV" calls ExportService.export with the current filter', async () => {
    await createFixture();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const menu = await loader.getHarness(MatMenuHarness.with({ selector: '[aria-label="Export submissions"]' }));
    await menu.open();
    await menu.clickItem({ text: /CSV/ });
    await fixture.whenStable();

    expect(exportMock.export).toHaveBeenCalledWith('csv', filterState());
  });

  it('substitutes ConfirmDialogComponent (not an admin-local dialog) when archiving a bulk selection', async () => {
    await createFixture();
    fixture.componentInstance['selectedIds'].set(new Set(['1']));
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = TestBed.inject(MatDialog);
    const openSpy = vi
      .spyOn(dialog, 'open')
      .mockReturnValue({ afterClosed: () => of(true) } as unknown as ReturnType<MatDialog['open']>);

    await fixture.componentInstance['archiveSelected']();
    await fixture.whenStable();

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toBe(ConfirmDialogComponent);
    expect(mutationsMock.applyBulk).toHaveBeenCalledWith(['1'], { status: 'archived' });
  });
});

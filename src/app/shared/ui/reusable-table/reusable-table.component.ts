import { Component, viewChild, signal, effect, input, output, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TableColumn, FilterOptions, FilterState, ExcelColumnConfig, PaginationServiceInterface } from './table.model';
import { NgTemplateOutlet } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { LoggerService } from '@core/services/logger/logger.service';
import { SharedIconModule } from '@shared/ui/mat-icon';

@Component({
  selector: 'app-reusable-table',
  templateUrl: './reusable-table.component.html',
  styleUrl: './reusable-table.component.scss',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    SharedIconModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    NgTemplateOutlet,
    MatChipsModule,
    FormsModule,
  ],
  host: {
    class: 'flex flex-col flex-1',
  },
})
export class ReusableTable<T extends object> {
  readonly #logger = inject(LoggerService);

  readonly data = input.required<T[]>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly paginationService = input<PaginationServiceInterface<T>>();

  readonly headerTitle = input<string>();
  readonly headerIcon = input<string>();
  readonly subTitle = input<string>();
  readonly showHeaderControls = input(true);
  readonly isLoading = input<boolean>(false);
  readonly hasServerFilters = input<boolean>(false);

  readonly exportRequested = output<{ data: T[]; columns: ExcelColumnConfig<T>[]; filename?: string }>();
  readonly filterChanged = output<{ column: keyof T; value: unknown }>();
  readonly searchValue = output<string>();
  readonly rowClick = output<T>();

  readonly paginator = viewChild(MatPaginator);
  readonly sort = viewChild.required(MatSort);

  readonly columnFilters = signal<Partial<Record<keyof T, unknown>>>({});
  readonly activeMenuColumn = signal<TableColumn<T> | null>(null);
  readonly filterOptionsCache = signal<Partial<Record<keyof T, FilterOptions[]>>>({});
  readonly filterOptions = signal<FilterOptions[]>([]);
  readonly dataSource = new MatTableDataSource<T>();
  readonly serverFilterState = signal<Map<keyof T, unknown>>(new Map());
  protected readonly searchTerm = signal('');

  readonly displayedColumns = computed(() => {
    const columnKeys = this.columns().map((c) => this.getStringKey(c.key));
    return columnKeys;
  });

  readonly shouldShowFooter = computed(() => {
    const service = this.paginationService();
    if (!service) return this.data().length > 10;
    if (service.isLoading()) return false;
    return service.total() > 10 || service.items().length > 10;
  });

  readonly hasActiveFilters = computed(() => {
    const clientFilters = this.columnFilters();
    const serverFilters = this.serverFilterState();
    const parentServerFilters = this.hasServerFilters();

    const hasClientFilters = Object.keys(clientFilters).length > 0;
    const hasServerFilters = serverFilters.size > 0;

    return hasClientFilters || hasServerFilters || parentServerFilters;
  });

  constructor() {
    this.dataSource.filterPredicate = (row, filter) => this.matchesClientFilter(row, filter);
    this.setupDataSourceEffects();
    this.setupFilterEffects();
    this.setupPaginatorAndSortEffects();
    this.setupServerPaginationEffect();
  }

  onSearchSubmit(): void {
    this.searchValue.emit(this.searchTerm());
  }

  getStringKey = String;

  onRowClick(event: MouseEvent, row: T): void {
    // Ignore clicks originating from interactive child elements (buttons, links, menus)
    if (this.isInteractiveTarget(event.target)) return;
    this.rowClick.emit(row);
  }

  onRowKeydown(event: KeyboardEvent, row: T): void {
    if (this.isInteractiveTarget(event.target) && event.target !== event.currentTarget) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.rowClick.emit(row);
    }
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return !!(target as HTMLElement | null)?.closest(
      'button, a, [matMenuTriggerFor], [role="button"], mat-icon, .mat-icon-button, .mat-button',
    );
  }

  isServerFilterActive(columnKey: keyof T, value: unknown): boolean {
    return this.serverFilterState().get(columnKey) === value;
  }

  isClientFilterActive(columnKey: keyof T, value: unknown): boolean {
    return (this.columnFilters() as Record<keyof T, unknown>)[columnKey] === value;
  }

  trackByFn(index: number, item: T): string | number {
    const withId = item as Partial<Record<'id', string | number>>;
    return withId.id ?? index;
  }

  onMenuOpened(column: TableColumn<T>): void {
    this.activeMenuColumn.set(column);

    if (column.serverFilter && column.filterOptions) {
      this.filterOptions.set(column.filterOptions);
    } else {
      const cachedOptions = this.filterOptionsCache()[column.key as keyof T] ?? [];
      this.filterOptions.set(cachedOptions);
    }
  }

  isColumnFiltered(column: TableColumn<T>): boolean {
    if (column.serverFilter) {
      return this.serverFilterState().has(column.key);
    }
    const current = this.columnFilters()[column.key as keyof T];
    return current !== undefined && current !== null && String(current).length > 0;
  }

  applyColumnFilter(value: unknown): void {
    const column = this.activeMenuColumn();
    if (!column) return;

    if (column.serverFilter) {
      this.serverFilterState.update((state) => {
        const newState = new Map(state);
        newState.set(column.key, value);
        return newState;
      });
      this.filterChanged.emit({ column: column.key, value });
    } else {
      this.columnFilters.update((filters) => ({ ...filters, [column.key]: value }));
    }
  }

  clearColumnFilter(): void {
    const column = this.activeMenuColumn();
    if (!column) return;

    if (column.serverFilter) {
      this.serverFilterState.update((state) => {
        const newState = new Map(state);
        newState.delete(column.key);
        return newState;
      });
      this.filterChanged.emit({ column: column.key, value: null });
    } else {
      this.columnFilters.update((filters) => {
        const next = { ...filters };
        delete next[column.key as keyof T];
        return next;
      });
    }
  }

  clearAllFilters(): void {
    this.clearSearch();
    this.columnFilters.set({});
    this.clearAllServerFilters();
    this.activeMenuColumn.set(null);
  }

  clearAllServerFilters(): void {
    this.serverFilterState.set(new Map());
    const serverFilterColumns = this.columns().filter((col) => col.serverFilter);
    for (const column of serverFilterColumns) {
      this.filterChanged.emit({ column: column.key, value: null });
    }
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.onSearchSubmit();
  }

  async onPageChange(event: PageEvent): Promise<void> {
    const service = this.paginationService();
    if (!service) return;

    const currentPageIndex = service.currentPage() - 1;

    if (event.pageSize !== service.state().limit) {
      await service.setPageSize(event.pageSize);
      return;
    }

    if (event.pageIndex === 0 && currentPageIndex > 0) {
      await service.loadPage('first');
      return;
    }

    const totalPages = service.totalPages();
    if (event.pageIndex === totalPages - 1 && currentPageIndex < totalPages - 1) {
      await service.loadPage('last');
      return;
    }

    if (event.pageIndex > currentPageIndex) {
      await service.loadPage('next');
    } else if (event.pageIndex < currentPageIndex) {
      await service.loadPage('prev');
    }
  }

  exportCurrentData(customColumns?: ExcelColumnConfig<T>[], filename?: string): void {
    const currentData = this.dataSource.filteredData || this.dataSource.data;

    if (!currentData || currentData.length === 0) {
      this.#logger.warn('No data to export');
      return;
    }

    const exportableColumns = this.getExportableColumns(customColumns);

    this.exportRequested.emit({
      data: currentData,
      columns: exportableColumns,
      filename,
    });
  }

  private setupDataSourceEffects(): void {
    effect(() => {
      const incomingData = this.data();
      this.updateDataSource(incomingData);
      this.updateFilterOptionsCache(incomingData);
    });
  }

  private setupFilterEffects(): void {
    effect(() => {
      const filterState: FilterState = {
        columns: this.columnFilters(),
      };
      this.applyFilters(filterState);
    });
  }

  private setupPaginatorAndSortEffects(): void {
    effect(() => {
      const paginator = this.paginator();
      const sort = this.sort();
      const service = this.paginationService();

      this.dataSource.sort = sort;
      // Attach client paginator only when not delegating to server paginationService
      this.dataSource.paginator = !service && paginator ? paginator : null;
    });
  }

  private setupServerPaginationEffect(): void {
    effect(() => {
      const service = this.paginationService();
      if (!service) return;

      const paginator = this.paginator();

      if (service && paginator) {
        paginator.length = service.total();
        paginator.pageIndex = service.currentPage() - 1;
        paginator.pageSize = service.state().limit;
      }
    });
  }

  private updateDataSource(data: T[]): void {
    this.dataSource.data = Array.isArray(data) ? data : [];
  }

  private updateFilterOptionsCache(data: T[]): void {
    const newCache: Partial<Record<keyof T, FilterOptions[]>> = {};
    const filterableColumns = this.columns().filter((column) => column.hasMenu);

    for (const column of filterableColumns) {
      const uniqueValues = this.getUniqueValuesForColumn(data, column.key);
      newCache[column.key as keyof T] = uniqueValues.map((value) => ({
        value,
        label: this.capitalizeLabel(String(value)),
      }));
    }

    this.filterOptionsCache.set(newCache);
  }

  private getUniqueValuesForColumn(data: T[], key: keyof T): unknown[] {
    return [...new Set(data.map((item) => item[key]))];
  }

  private capitalizeLabel(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  /** Evaluates whether a row satisfies all active client column filters. */
  private matchesClientFilter(row: T, filter: string): boolean {
    if (!filter) return true;
    const { columns } = JSON.parse(filter) as FilterState;
    return Object.entries(columns).every(([key, value]) => {
      if (value === undefined || value === null || value === '') return true;
      return String(row[key as keyof T]) === String(value);
    });
  }

  private applyFilters(filterState: FilterState): void {
    const hasClientFilters = filterState?.columns && Object.keys(filterState.columns).length > 0;

    this.dataSource.filter = hasClientFilters ? JSON.stringify(filterState) : '';
    if (hasClientFilters) {
      this.dataSource.paginator?.firstPage();
    }
  }

  private getExportableColumns(customColumns?: ExcelColumnConfig<T>[]): ExcelColumnConfig<T>[] {
    if (customColumns) {
      return customColumns;
    }

    return this.columns()
      .filter((column) => {
        if (column.exportable === false) return false;
        return true;
      })
      .map((column) => ({
        key: column.key,
        label: column.label,
        formatter: column.excelFormatter,
      }));
  }
}

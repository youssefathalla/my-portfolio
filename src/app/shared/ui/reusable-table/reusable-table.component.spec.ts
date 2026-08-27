import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReusableTable } from './reusable-table.component';
import { TableColumn } from './table.model';

interface Row {
  id: string;
  name: string;
  status: string;
}

const columns: TableColumn<Row>[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name', sortable: true, hasMenu: true },
  { key: 'status', label: 'Status' },
];

const rows: Row[] = [
  { id: '1', name: 'Ada', status: 'active' },
  { id: '2', name: 'Grace', status: 'inactive' },
  { id: '3', name: 'Alan', status: 'active' },
];

describe('ReusableTable', () => {
  let component: ReusableTable<Row>;
  let fixture: ComponentFixture<ReusableTable<Row>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReusableTable],
    }).compileComponents();

    fixture = TestBed.createComponent(ReusableTable<Row>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('feeds the incoming data into the MatTableDataSource', () => {
    expect(component.dataSource.data).toEqual(rows);
  });

  it('applies a client-side column filter and hides non-matching rows', () => {
    component.onMenuOpened(columns[1]);
    component.applyColumnFilter('Ada');
    fixture.detectChanges();

    expect(component.dataSource.filteredData).toEqual([rows[0]]);
    expect(component.isClientFilterActive('name', 'Ada')).toBe(true);
  });

  it('clears a client-side column filter and restores all rows', () => {
    component.onMenuOpened(columns[1]);
    component.applyColumnFilter('Ada');
    component.clearColumnFilter();
    fixture.detectChanges();

    expect(component.dataSource.filteredData).toEqual(rows);
  });

  it('emits filterChanged for server-side filter columns instead of filtering client-side', () => {
    const serverColumn: TableColumn<Row> = { key: 'status', label: 'Status', serverFilter: true };
    let emitted: { column: keyof Row; value: unknown } | undefined;
    component.filterChanged.subscribe((event) => (emitted = event));

    component.onMenuOpened(serverColumn);
    component.applyColumnFilter('active');

    expect(emitted).toEqual({ column: 'status', value: 'active' });
    // Server filters must not affect the client-side dataSource filter.
    expect(component.dataSource.filteredData).toEqual(rows);
  });

  it('emits rowClick only when the click target is not interactive', () => {
    let clicked: Row | undefined;
    component.rowClick.subscribe((row) => (clicked = row));

    const plainDiv = document.createElement('div');
    component.onRowClick({ target: plainDiv } as unknown as MouseEvent, rows[0]);
    expect(clicked).toEqual(rows[0]);

    clicked = undefined;
    const button = document.createElement('button');
    component.onRowClick({ target: button } as unknown as MouseEvent, rows[0]);
    expect(clicked).toBeUndefined();
  });
});

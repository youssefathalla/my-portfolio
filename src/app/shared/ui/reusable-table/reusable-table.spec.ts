import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReusableTable } from './reusable-table';

describe('ReusableTable', () => {
  let component: ReusableTable<any>;
  let fixture: ComponentFixture<ReusableTable<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReusableTable],
    }).compileComponents();

    fixture = TestBed.createComponent(ReusableTable);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('columns', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReusableTable } from './reusable-table';

describe('ReusableTable', () => {
  let component: ReusableTable<any>;
  let fixture: ComponentFixture<ReusableTable<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReusableTable<any>]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReusableTable<any>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

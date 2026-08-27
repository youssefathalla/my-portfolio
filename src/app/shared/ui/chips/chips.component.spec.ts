import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChipsComponent } from './chips.component';

describe('ChipsComponent', () => {
  let component: ChipsComponent<string>;
  let fixture: ComponentFixture<ChipsComponent<string>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent<ChipsComponent<string>>(ChipsComponent);
    component = fixture.componentInstance;

    // Set required input
    fixture.componentRef.setInput('chips', ['test']);
    fixture.componentRef.setInput('value', 'test');

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { LOCALE } from '@core/i18n/locale';
import { HourlySprintsComponent } from './hourly-sprints.component';

describe('HourlySprintsComponent', () => {
  let component: HourlySprintsComponent;
  let fixture: ComponentFixture<HourlySprintsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HourlySprintsComponent],
      providers: [
        provideRouter([], withComponentInputBinding()),
        { provide: LOCALE, useValue: 'en' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HourlySprintsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

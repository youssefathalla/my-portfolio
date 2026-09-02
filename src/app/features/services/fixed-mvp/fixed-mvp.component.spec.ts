import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { LOCALE } from '@core/i18n/locale';
import { FixedMvpComponent } from './fixed-mvp.component';

describe('FixedMvpComponent', () => {
  let component: FixedMvpComponent;
  let fixture: ComponentFixture<FixedMvpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FixedMvpComponent],
      providers: [
        provideRouter([], withComponentInputBinding()),
        { provide: LOCALE, useValue: 'en' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FixedMvpComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

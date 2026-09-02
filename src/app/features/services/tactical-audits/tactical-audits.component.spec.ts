import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { LOCALE } from '@core/i18n/locale';
import { TacticalAuditsComponent } from './tactical-audits.component';

describe('TacticalAuditsComponent', () => {
  let component: TacticalAuditsComponent;
  let fixture: ComponentFixture<TacticalAuditsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TacticalAuditsComponent],
      providers: [
        provideRouter([], withComponentInputBinding()),
        { provide: LOCALE, useValue: 'en' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TacticalAuditsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

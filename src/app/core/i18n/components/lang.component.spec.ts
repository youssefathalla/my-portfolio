import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { describe, it, expect } from 'vitest';

import { LOCALE } from '../locale';
import { LangComponent } from './lang.component';

describe('LangComponent', () => {
  let component: LangComponent;
  let fixture: ComponentFixture<LangComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LangComponent],
      providers: [provideRouter([], withComponentInputBinding()), { provide: LOCALE, useValue: 'en' }],
    }).compileComponents();

    fixture = TestBed.createComponent(LangComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('resolves exactly one Language_Switcher target for the active locale', () => {
    expect(component['targets']()).toEqual([{ locale: 'ar', path: 'ar' }]);
  });
});

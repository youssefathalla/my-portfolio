import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { LOCALE } from '@core/i18n/locale';
import { SiteNavComponent } from './site-nav.component';

describe('SiteNavComponent', () => {
  let component: SiteNavComponent;
  let fixture: ComponentFixture<SiteNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteNavComponent],
      providers: [
        provideRouter([], withComponentInputBinding()),
        { provide: LOCALE, useValue: 'en' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteNavComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { LOCALE } from '../locale';
import { LangService } from './lang.service';

function configure(locale: 'en' | 'ar') {
  TestBed.configureTestingModule({
    providers: [{ provide: LOCALE, useValue: locale }],
  });
}

describe('LangService', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('dir');
    document.body.classList.remove('ltr', 'rtl');
  });

  it('should be created', () => {
    configure('en');
    const service = TestBed.inject(LangService);
    expect(service).toBeTruthy();
  });

  it('derives English with left-to-right direction from the injected LOCALE token', () => {
    configure('en');
    const service = TestBed.inject(LangService);
    TestBed.flushEffects();

    expect(service.currentLang()).toBe('en');
    expect(service.direction()).toBe('ltr');
  });

  it('derives Arabic with right-to-left direction and updates the document when LOCALE is ar', () => {
    configure('ar');
    const service = TestBed.inject(LangService);
    TestBed.flushEffects();

    expect(service.currentLang()).toBe('ar');
    expect(service.direction()).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.body.classList.contains('rtl')).toBe(true);
    expect(document.body.classList.contains('ltr')).toBe(false);
  });

  it('fails loudly when injected outside a Locale_Route_Group (no LOCALE provider)', () => {
    TestBed.configureTestingModule({});

    expect(() => TestBed.inject(LangService)).toThrow();
  });
});

import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { LangService } from './lang.service';

describe('LangService', () => {
  let service: LangService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('dir');
    document.body.classList.remove('ltr', 'rtl');

    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {}, ar: {} },
          translocoConfig: { availableLangs: ['en', 'ar'], defaultLang: 'en' },
        }),
      ],
    });
    service = TestBed.inject(LangService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('defaults to English with left-to-right direction', () => {

    expect(service.currentLang()).toBe('en');
    expect(service.direction()).toBe('ltr');
  });

  it('switches to right-to-left direction and updates the document when Arabic is selected', () => {
    service.setLanguage('ar');
    TestBed.flushEffects();

    expect(service.currentLang()).toBe('ar');
    expect(service.direction()).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.body.classList.contains('rtl')).toBe(true);
    expect(document.body.classList.contains('ltr')).toBe(false);
  });

  it('persists the selected language to localStorage', () => {
    service.setLanguage('ar');
    TestBed.flushEffects();
    expect(localStorage.getItem('lang')).toBe('ar');
  });

  it('restores a previously saved language on initialization', () => {
    localStorage.setItem('lang', 'ar');

    const restored = TestBed.runInInjectionContext(() => new LangService());

    expect(restored.currentLang()).toBe('ar');
  });

  it('ignores an unsupported saved language and falls back to the default', () => {
    localStorage.setItem('lang', 'fr');

    const restored = TestBed.runInInjectionContext(() => new LangService());

    expect(restored.currentLang()).toBe('en');
  });
});

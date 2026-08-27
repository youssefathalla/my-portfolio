import { Direction } from '@angular/cdk/bidi';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, effect, inject, Service, PLATFORM_ID, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SupportedLanguage } from '../transloco.config';

@Service()
export class LangService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentLang = signal<SupportedLanguage>('en');
  readonly direction = signal<Direction>('ltr');

  constructor() {
    this.initLanguage();

    effect(() => {
      const lang = this.currentLang();
      const dir = lang === 'ar' ? 'rtl' : 'ltr';

      this.direction.set(dir);
      this.transloco.setActiveLang(lang);

      this.updateDocumentDirection(lang, dir);

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('lang', lang);
      }
    });
  }

  private initLanguage() {
    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('lang') as SupportedLanguage;
      const supported: SupportedLanguage[] = ['en', 'ar'];
      if (savedLang && supported.includes(savedLang)) {
        this.currentLang.set(savedLang);
      }
    }
  }

  setLanguage(lang: SupportedLanguage) {
    this.currentLang.set(lang);
  }

  private updateDocumentDirection(lang: string, dir: Direction) {
    const html = this.document.documentElement;
    html.lang = lang;
    html.dir = dir;

    this.document.body.classList.remove('rtl', 'ltr');
    this.document.body.classList.add(dir);
  }
}

import {
  Service,
  signal,
  effect,
  inject,
  RendererFactory2,
  PLATFORM_ID,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

@Service()
export class ThemeService {
  readonly #renderer = inject(RendererFactory2).createRenderer(null, null);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #document = inject(DOCUMENT);

  // Always start with SSR-safe default; browser-specific init is deferred to afterNextRender
  readonly #darkMode = signal<boolean>(false);
  readonly isDarkMode = this.#darkMode.asReadonly();

  constructor() {
    afterNextRender(() => {
      // Priority 1: User's explicit preference from localStorage
      const saved = localStorage.getItem('user-theme');
      if (saved) {
        this.#darkMode.set(saved === 'dark');
      } else {
        // Priority 2: System preference
        this.#darkMode.set(globalThis.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    });

    effect(() => {
      const isDark = this.#darkMode();
      // Safe execution only in browser
      if (isPlatformBrowser(this.#platformId)) {
        this.#renderer.setStyle(this.#document.documentElement, 'color-scheme', isDark ? 'dark' : 'light');
        if (isDark) {
          this.#renderer.addClass(this.#document.documentElement, 'dark');
        } else {
          this.#renderer.removeClass(this.#document.documentElement, 'dark');
        }
      }
    });
  }

  toggleTheme() {
    this.#darkMode.update((v) => {
      const newValue = !v;
      if (isPlatformBrowser(this.#platformId))
        localStorage.setItem('user-theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  }
}

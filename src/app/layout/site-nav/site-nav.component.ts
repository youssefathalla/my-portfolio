import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LangService } from '@core/i18n/services/lang.service';
import { LangComponent } from '@core/i18n/components/lang.component';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { isBrowser } from '@core/platform/platform';
import { ThemeService } from '@core/services/theme/theme.service';
import { SITE_NAV_CONTENT } from './site-nav.content';

@Component({
  selector: 'app-site-nav',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, LangComponent, SharedIconModule],
  templateUrl: './site-nav.component.html',
  host: {
    class: 'sticky top-0 z-50 block w-full h-18',
  },
})
export class SiteNavComponent implements OnInit {
  readonly #lang = inject(LangService);
  readonly #theme = inject(ThemeService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #isBrowser = isBrowser();

  protected readonly isScrolled = signal(false);
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isDarkMode = this.#theme.isDarkMode;
  protected readonly t = computed(() => SITE_NAV_CONTENT[this.#lang.currentLang()]);

  toggleTheme(): void {
    this.#theme.toggleTheme();
  }

  ngOnInit(): void {
    if (this.#isBrowser) {
      this.#initScrollListener();
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  #initScrollListener(): void {
    const handleScroll = (): void => {
      const y = window.scrollY;
      const currentlyScrolled = this.isScrolled();

      if (this.isMobileMenuOpen()) {
        this.closeMobileMenu();
      }

      // Hysteresis buffer: activate after 50px, deactivate only when back near top (< 15px)
      if (!currentlyScrolled && y > 50) {
        this.isScrolled.set(true);
      } else if (currentlyScrolled && y < 15) {
        this.isScrolled.set(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    this.#destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', handleScroll);
    });
  }
}

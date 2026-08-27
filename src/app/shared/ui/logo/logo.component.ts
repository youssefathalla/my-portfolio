import { Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '@core/services/theme/theme.service';

@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  template: `
    <button
      class="flex items-center gap-3 cursor-pointer group select-none text-left"
      routerLink="/"
      aria-label="Go to homepage"
      (click)="clicked.emit()"
    >
      <!-- Modern Branded Vector Emblem -->
      <div
        class="w-10 h-10 rounded-corner-sm flex items-center justify-center transition-all duration-300 shadow-mat-1 group-hover:scale-105"
        [class.bg-primary]="!isDarkMode()"
        [class.text-on-primary]="!isDarkMode()"
        [class.bg-primary-container]="isDarkMode()"
        [class.text-on-primary-container]="isDarkMode()"
      >
        <svg
          class="w-6 h-6 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2L2 6l1.8 11.5L12 22l8.2-4.5L22 6L12 2zm0 2.8l6.8 2.7l-1.3 8.3L12 18.3l-5.5-2.5l-1.3-8.3L12 4.8zM12 7.5L8.5 14.5h2l.7-1.5h3.6l.7 1.5h2L12 7.5zm0 2.6l1.2 2.6h-2.4L12 10.1z"/>
        </svg>
      </div>

      <!-- Brand Typography -->
      <div class="flex flex-col">
        <span class="font-title-md font-bold tracking-tight text-on-surface leading-tight">
          Angular<span class="text-primary">Lab</span>
        </span>
        <span class="font-label-sm text-on-surface-variant/70 tracking-wide text-[10px] uppercase font-mono">
          Design System
        </span>
      </div>
    </button>
  `,
  host: { class: 'flex' },
})
export class LogoComponent {
  readonly #themeService = inject(ThemeService);
  readonly clicked = output<void>();

  readonly isDarkMode = computed(() => this.#themeService.isDarkMode());
}

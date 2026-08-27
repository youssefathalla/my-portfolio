import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '@core/services/theme/theme.service';

@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  template: `
    <button
      class="items-center flex-col flex cursor-pointer"
      routerLink="/"
      aria-label="Go to homepage"
      (click)="clicked.emit()"
    >
      <img
        src="/logo.gif"
        [class.bg-primary]="isDarkMode()"
        class="hidden md:block  h-16 w-auto px-1 py-1.5 rounded-corner-xs"
        alt="Removals & Transport logo"
      />
      <img
        src="/logo.gif"
        [class.bg-primary]="isDarkMode()"
        class="md:hidden h-13 w-auto p-1 rounded-corner-xs"
        alt="Removals & Transport logo"
      />
    </button>
  `,
  host: { class: 'flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  readonly #themeService = inject(ThemeService);
  readonly clicked = output<void>();

  readonly isDarkMode = computed(() => this.#themeService.isDarkMode());
}

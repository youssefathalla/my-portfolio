import { inject, Service } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { SVG_ICONS } from '@shared/ui/svg-icon/icons';

@Service()
export class SvgIconService {
  readonly #iconRegistry = inject(MatIconRegistry);
  readonly #domSanitizer = inject(DomSanitizer);

  constructor() {
    this.#registerIcons();
  }

  #registerIcons() {
    SVG_ICONS.forEach((icon: string) => {
      // Security: Validate icon name to prevent path traversal
      if (!/^[a-z0-9-]+$/i.test(icon)) {
        console.warn(`[Security] Invalid icon name: ${icon}`);
        return;
      }
      this.#iconRegistry.addSvgIcon(
        icon,
        this.#domSanitizer.bypassSecurityTrustResourceUrl(`icons/${icon}.svg`),
      );
    });
  }
}

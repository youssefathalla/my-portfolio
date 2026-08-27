import { inject, Service } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { SVG_ICONS } from '@core/services/icons/icons';
import { LoggerService } from '@core/services/logger/logger.service';

@Service()
export class SvgIconService {
  readonly #iconRegistry = inject(MatIconRegistry);
  readonly #domSanitizer = inject(DomSanitizer);
  readonly #logger = inject(LoggerService);

  constructor() {
    this.#registerIcons();
  }

  #registerIcons() {
    SVG_ICONS.forEach((icon: string) => {
      // Security: Validate icon name to prevent path traversal
      if (!/^[a-z0-9-]+$/i.test(icon)) {
        this.#logger.warn(`[Security] Invalid icon name: ${icon}`);
        return;
      }
      // Safe to bypass sanitization: `icon` was validated above against a strict
      // `[a-z0-9-]+` allowlist, so it cannot contain path separators, protocol
      // prefixes, or traversal sequences (e.g. "..", "/", "\"). The resulting URL
      // always resolves to a static, bundled asset under the local `icons/` folder,
      // never to user-supplied or remote content.
      this.#iconRegistry.addSvgIcon(
        icon,
        this.#domSanitizer.bypassSecurityTrustResourceUrl(`icons/${icon}.svg`), // NOSONAR: icon name is validated above against a strict allowlist
      );
    });
  }
}

/**
 * Admin_Shell (admin-dashboard R5).
 *
 * The layout component wrapping all authenticated admin child routes. Provides:
 * - A sidebar with links to Overview and Submissions (R5.1, R5.3)
 * - A header showing the authenticated email and a logout button (R5.1, R5.2)
 * - A skip-to-content link as the first focusable element (R5.6)
 * - CSS-only responsive sidebar collapsing to an icon rail below 1024px (R5.4)
 * - The shared obsidian/glass/accent-cyan theme tokens (R5.5)
 * - A `<router-outlet>` for child content
 */

import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../auth/auth.service';
import { ADMIN_CONTENT } from '../../content/admin.content';
import { ADMIN_ICON_GLYPH } from '../../shared/admin-icon';
import { SeoService } from '@core/seo/seo.service';
import { SharedIconModule } from '@shared/ui/mat-icon';

@Component({
  selector: 'app-admin-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatTooltipModule,
    SharedIconModule,
  ],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Icon glyph lookup exposed to the template for nav entries (R11.15). */
  protected readonly ADMIN_ICON_GLYPH = ADMIN_ICON_GLYPH;

  /** The authenticated user's email, derived from the Auth_State signal (R5.1). */
  protected readonly email = computed(() => {
    const s = this.auth.authState();
    return s.kind === 'authenticated' ? s.email : null;
  });

  /** Navigation entries for the sidebar (R5.1). */
  protected readonly nav = ADMIN_CONTENT.nav;

  constructor() {
    inject(SeoService).initExcludedRoute(ADMIN_CONTENT.shellTitle, 'noindex, nofollow'); // R3.6
  }

  /** Logout: sign out then navigate to the login page (R5.2). */
  protected async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/admin/login']);
  }
}

/**
 * LoginPage — Google Sign-In via popup.
 */

import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';

import { SeoService } from '@core/seo/seo.service';
import { ADMIN_CONTENT } from '../../content/admin.content';
import { AuthService } from '../../auth/auth.service';
import { type AuthErrorCode, normalizeAuthError, toLoginErrorMessage } from '../../auth/auth-state';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly errorCode = signal<AuthErrorCode | null>(null);
  protected readonly errorMessage = computed(() => {
    const code = this.errorCode();
    return code === null ? null : toLoginErrorMessage(code);
  });

  constructor() {
    inject(SeoService).initExcludedRoute(ADMIN_CONTENT.loginTitle, 'noindex, nofollow');
    void this.auth.warmUp();
  }

  protected async signIn(): Promise<void> {
    this.submitting.set(true);
    this.errorCode.set(null);

    try {
      await this.auth.signInWithGoogle();
      // Popup succeeded and admin claim verified — navigate to dashboard.
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(returnUrl || '/admin');
    } catch (err: unknown) {
      const code = normalizeAuthError(err);
      // Don't show error if user just closed the popup
      if (code !== 'unknown') {
        this.errorCode.set(code);
      }
    } finally {
      this.submitting.set(false);
    }
  }
}

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { AuthDialogService } from '@core/services/auth/auth-dialog.service';
import { LoadingService } from '@core/services/loading/loading.service';
import { SnackbarService } from '@core/services/snack-bar/snack-bar.service';

/**
 * Guard for /admin-dashboard.
 * Route is RenderMode.Client in app.routes.server.ts — this guard only runs in the browser.
 *
 * Flow:
 *  1. Guest → redirect home, show login dialog, then navigate to dashboard if admin.
 *  2. User (not admin) → snackbar error + redirect home.
 *  3. Admin → allow access.
 */
export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const authDialogService = inject(AuthDialogService);
  const loadingService = inject(LoadingService);
  const snackbar = inject(SnackbarService);

  loadingService.setLoading('admin-guard');

  try {
    // 1. Wait for Firebase Auth to finish loading
    await authService.waitForAuthReady();

    // 2. Not logged in — redirect home first (so the page is never visible), then prompt login
    if (!authService.isAuthenticated()) {
      loadingService.stopLoading('admin-guard');

      // Navigate home immediately so no broken page shows behind the dialog
      await router.navigate(['/']);

      const loggedIn = await authDialogService.openLoginDialog(
        'Please sign in to access the Admin Dashboard.',
      );

      if (!loggedIn) {
        return false; // Already on home, just stay here
      }

      // User logged in — check admin, then redirect them to admin-dashboard
      if (await authService.checkIsAdmin()) {
        await router.navigate(['/admin-dashboard']);
      } else {
        snackbar.error("You don't have permission to access the Admin Dashboard.");
      }

      return false; // Guard always blocks — navigation is handled above
    }

    // 3. Logged in but not admin — snackbar + redirect home
    if (!(await authService.checkIsAdmin())) {
      snackbar.error("You don't have permission to access the Admin Dashboard.");
      router.navigate(['/']);
      return false;
    }

    // 4. Logged in and admin — allow access
    return true;
  } finally {
    loadingService.stopLoading('admin-guard');
  }
};

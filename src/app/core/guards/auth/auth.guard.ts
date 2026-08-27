// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { AuthService } from '@core/services/auth/auth.service';
// import { AuthDialogService } from '@core/services/auth/auth-dialog.service';
// import { LoadingService } from '@core/services/loading/loading.service';

// /**
//  * Guard for protected user routes (/profile, /profile/:quoteId, etc.).
//  * Routes are RenderMode.Client in app.routes.server.ts — this guard only runs in the browser.
//  *
//  * Flow:
//  *  1. Authenticated → allow access.
//  *  2. Guest → show login dialog. If they log in → allow. If dismissed → redirect home.
//  */
// export const authGuard: CanActivateFn = async () => {
//   const authService = inject(AuthService);
//   const authDialogService = inject(AuthDialogService);
//   const loadingService = inject(LoadingService);
//   const router = inject(Router);

//   loadingService.setLoading('auth-guard');

//   try {
//     // 1. Wait for Firebase Auth to finish loading (prevents race condition)
//     await authService.waitForAuthReady();

//     // 2. Already logged in — allow access
//     if (authService.isAuthenticated()) return true;

//     // 3. Not logged in — show login dialog with context message
//     loadingService.stopLoading('auth-guard');

//     const loggedIn = await authDialogService.openLoginDialog('Please sign in to continue.');

//     // 4. User dismissed dialog without logging in — redirect home
//     if (!loggedIn) {
//       router.navigate(['/']);
//       return false;
//     }

//     return true;
//   } finally {
//     loadingService.stopLoading('auth-guard');
//   }
// };

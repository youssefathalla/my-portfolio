/**
 * Route guards controlling navigation to admin pages based on authentication state.
 * Security enforcement remains in firestore.rules; these guards manage UX redirection.
 */
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { filter, map, take, timeout } from 'rxjs/operators';

import { ResolvedAuthState, UNAUTHENTICATED } from './auth-state';
import { AuthService } from './auth.service';

/** Returns true if authenticated, or redirects to /admin/login preserving the returnUrl. */
export function decideAuthAccess(
  state: ResolvedAuthState,
  attemptedUrl: string,
  router: Router,
): boolean | UrlTree {
  if (state.kind === 'authenticated') return true;
  return router.createUrlTree(['/admin/login'], {
    queryParams: { returnUrl: attemptedUrl },
  });
}

/** Guards admin routes by waiting for auth resolution and redirecting unauthenticated users. */
export const authGuard: CanActivateFn = (_route, state) => {
  const authState = inject(AuthService).authState;
  const router = inject(Router);
  return toObservable(authState).pipe(
    filter((s): s is ResolvedAuthState => s.kind !== 'loading'),
    take(1),
    timeout({ first: 5_000, with: () => of(UNAUTHENTICATED) }),
    map((resolved) => decideAuthAccess(resolved, state.url, router)),
  );
};

/** Redirects already-authenticated users away from /admin/login to /admin. */
export const loginRedirectGuard: CanActivateFn = () => {
  const authState = inject(AuthService).authState;
  const router = inject(Router);
  return toObservable(authState).pipe(
    filter((s): s is ResolvedAuthState => s.kind !== 'loading'),
    take(1),
    timeout({ first: 5_000, with: () => of(UNAUTHENTICATED) }),
    map((resolved) => {
      if (resolved.kind === 'authenticated') {
        return router.createUrlTree(['/admin']);
      }
      return true;
    }),
  );
};

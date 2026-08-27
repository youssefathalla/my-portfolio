import { inject, Injector, runInInjectionContext } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { mapFirebaseError } from '@shared/utils/firebase/firebase-errors';
import { LoggerService } from '@core/services/logger/logger.service';


// A type alias for the async action to keep the function signature clean.
type AsyncAction<T> = () => Promise<T> | Observable<T>;

/**
 * Factory for a function that runs an async action within Angular's injection context.
 * It handles both Promise-based and Observable-based actions with unified error mapping.
 *
 * Firebase APIs must be called synchronously within an injection context.
 * This helper ensures the action runs within the injection context when the Observable
 * is created, not when it's subscribed to.
 *
 * @returns A function that takes an async action and an error context string.
 */
export function runInContextHelper$() {
  const injector = inject(Injector);
  const logger = inject(LoggerService);

  return <T>(action: AsyncAction<T>, errorContext: string): Observable<T> => {
    // Execute the action synchronously within injection context when Observable is created
    // This ensures Firebase APIs are called within the injection context
    let result: Promise<T> | Observable<T>;
    try {
      result = runInInjectionContext(injector, action);
    } catch (error) {
      // If synchronous execution fails, wrap in Observable and handle error
      const friendlyMessage = mapFirebaseError(error);
      return throwError(() => new Error(friendlyMessage));
    }

    // Handle both Promise and Observable results
    const observable = result instanceof Promise ? from(result) : result;

    return observable.pipe(
      catchError((error: unknown) => {
        logger.error(errorContext, error);
        const friendlyMessage = mapFirebaseError(error);
        return throwError(() => new Error(friendlyMessage));
      })
    );
  };
}

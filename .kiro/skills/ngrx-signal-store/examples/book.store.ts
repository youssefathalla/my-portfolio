import { inject, computed } from '@angular/core';
import {
  signalStore,
  withState,
  withProps,
  withMethods,
  withComputed,
  withHooks,
  patchState,
} from '@ngrx/signals';
import { withEntities, setAllEntities, addEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe } from 'rxjs';
import { tap, switchMap, finalize } from 'rxjs/operators';
import { BooksService } from './books.service'; // Example
import { LoggerService } from './logger.service'; // Example

export interface Book {
  id: string;
  title: string;
}

export const BookStore = signalStore(
  { providedIn: 'root' },

  // 1. STATE (Data Schema)
  withState({
    isLoading: false,
    filter: '',
  }),

  // 2. ENTITIES (Collection Management)
  withEntities<Book>(),

  // 3. PROPS (The "Injection Manifest")
  // All dependencies are declared here. Nowhere else.
  withProps(() => ({
    booksService: inject(BooksService),
    logger: inject(LoggerService),
  })),

  // 4. COMPUTED (Derived State)
  withComputed(({ entities, filter }) => ({
    filteredBooks: computed(() => entities().filter((b) => b.title.includes(filter()))),
    totalBooks: computed(() => entities().length),
  })),

  // 5. METHODS (Actions)
  withMethods((store) => ({
    // Simple State Change
    updateFilter(query: string): void {
      patchState(store, { filter: query });
    },

    // Async Action (RxMethod)
    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        // Access service from 'store' props (Clean!)
        switchMap(() =>
          store.booksService
            .getBooks()
            .pipe(finalize(() => patchState(store, { isLoading: false }))),
        ),
        tap((books) => {
          store.logger.log('Books loaded');
          patchState(store, setAllEntities(books));
        }),
      ),
    ),
  })),

  // 6. HOOKS (Lifecycle)
  withHooks({
    onInit(store) {
      store.loadAll(); // Auto-load on creation
    },
    onDestroy(store) {
      store.logger.log('BookStore destroyed');
    },
  }),
);

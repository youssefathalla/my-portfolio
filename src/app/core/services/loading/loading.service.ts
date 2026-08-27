import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly #loadingState = signal<Set<string>>(new Set());

  /**
   * Computed signal that's true if any process has registered as loading.
   */
  readonly isLoading = computed(() => this.#loadingState().size > 0);

  /**
   * Registers a unique key as "loading".
   * @param key - The unique identifier for the loading process.
   */
  setLoading(key: string): void {
    this.#loadingState.update((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  /**
   * Unregisters a unique key from "loading".
   * @param key - The unique identifier for the loading process.
   */
  stopLoading(key: string): void {
    this.#loadingState.update((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }
}

import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Returns whether the current execution context is a browser. Requires an injection context. */
export function isBrowser(): boolean {
  return isPlatformBrowser(inject(PLATFORM_ID));
}

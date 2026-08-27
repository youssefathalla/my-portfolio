import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { StepperOrientation } from '@angular/material/stepper';

/**
 * Returns a signal that emits `'horizontal'` or `'vertical'` based on viewport size.
 *
 * @param breakpoint - The min-width breakpoint.
 *   - If `number`: treated as pixels (e.g. `800` -> `'(min-width: 800px)'`).
 *   - If `string`: treated as a raw CSS media query (e.g. `'(min-width: 800px)'`).
 *   Defaults to `800`.
 */
export function useStepperOrientation(breakpoint: number | string = 800) {
  const breakpointObserver = inject(BreakpointObserver);
  const query = typeof breakpoint === 'number' ? `(min-width: ${breakpoint}px)` : breakpoint;

  return toSignal(
    breakpointObserver
      .observe(query)
      .pipe(map(({ matches }): StepperOrientation => (matches ? 'horizontal' : 'vertical'))),
    { initialValue: 'horizontal' as StepperOrientation },
  );
}

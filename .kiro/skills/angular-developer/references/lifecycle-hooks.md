# Lifecycle Hooks

Angular calls lifecycle hook methods on components and directives at specific points during their creation, update, and destruction. Two conventions keep lifecycle hooks maintainable as an application grows.

## Keep Lifecycle Methods Simple

Avoid putting long or complex logic directly inside a lifecycle hook like `ngOnInit`. Lifecycle hook names describe *when* code runs, not *what* it does — so unrolling a lot of logic into the hook body makes the code harder to scan. Extract well-named methods and call them from the hook instead.

```ts
// Prefer
ngOnInit() {
  this.startLogging();
  this.runBackgroundTask();
}

// Avoid
ngOnInit() {
  this.logger.setMode('info');
  this.logger.monitorErrors();
  // ...and all the rest of the code that would be unrolled from these methods.
}
```

## Use Lifecycle Hook Interfaces

Angular provides a TypeScript interface for each lifecycle method (`OnInit`, `OnDestroy`, `OnChanges`, `AfterViewInit`, etc.). Import and implement the matching interface whenever a class defines a lifecycle hook — this guarantees the method name is spelled correctly and gives you a compile-time check.

```ts
import {Component, OnInit} from '@angular/core';

@Component(/* ... */)
export class UserProfile implements OnInit {
  // The `OnInit` interface ensures this method is named correctly.
  ngOnInit() {
    /* ... */
  }
}
```

## Prefer Signal-Based Alternatives Where Possible

Many lifecycle hooks can be replaced with signal primitives that are easier to reason about and don't require an interface at all:

- `ngOnInit` for derived state → `computed()`.
- `ngOnChanges` reacting to an input → `computed()` or `effect()` reading the `input()` signal directly.
- `ngOnDestroy` for cleanup tied to a signal's lifetime → `effect()`'s automatic cleanup, or `DestroyRef`.

See [signals-overview.md](signals-overview.md) and [effects.md](effects.md) for details. Reach for a lifecycle hook when the signal-based alternative doesn't fit (e.g. `ngOnDestroy` for unsubscribing from a non-signal source, `AfterViewInit` for DOM measurements after render).

# Components

Angular components are the fundamental building blocks of an application. Each component consists of a TypeScript class with behaviors, an HTML template, and a CSS selector.

## Component Definition

Use the `@Component` decorator to define a component's metadata.

```ts
@Component({
  selector: 'app-profile',
  template: `
    <img src="profile.jpg" alt="Profile photo" />
    <button (click)="save()">Save</button>
  `,
  styles: `
    img {
      border-radius: 50%;
    }
  `,
})
export class Profile {
  save() {
    /* ... */
  }
}
```

## Metadata Options

- `selector`: The CSS selector that identifies this component in templates.
- `template`: Inline HTML template (preferred for small templates).
- `templateUrl`: Path to an external HTML file.
- `styles`: Inline CSS styles.
- `styleUrl` / `styleUrls`: Path(s) to external CSS file(s).
- `imports`: Lists the components, directives, or pipes used in this component's template.

## Using Components

To use a component, add it to the `imports` array of the consuming component and use its selector in the template.

```ts
@Component({
  selector: 'app-root',
  imports: [Profile],
  template: `<app-profile />`,
})
export class App {}
```

### Self-Closing Tags

Angular supports self-closing tags for custom components.

**Rule:** Always use self-closing tags when a component does not contain projected content or child nodes:

```html
<!-- Preferred: concise and modern -->
<app-profile />
<app-user-card [user]="currentUser()" />
<router-outlet />

<!-- Avoid: redundant closing tags for empty elements -->
<app-profile></app-profile>
<app-user-card [user]="currentUser()"></app-user-card>
<router-outlet></router-outlet>
```

## Template Control Flow

Angular uses built-in blocks for conditional rendering and loops.

### Conditional Rendering (`@if`)

Use `@if` to conditionally show content. You can include `@else if` and `@else` blocks.

```html
@if (user.isAdmin) {
<admin-dashboard />
} @else if (user.isModerator) {
<mod-dashboard />
} @else {
<standard-dashboard />
}
```

**Result aliasing**: Save the result of the expression for reuse.

```html
@if (user.settings(); as settings) {
<p>Theme: {{ settings.theme }}</p>
}
```

### Loops (`@for`)

The `@for` block iterates over collections. The `track` expression is **required** for performance and DOM reuse.

```html
<ul>
  @for (item of items(); track item.id; let i = $index, total = $count) {
  <li>{{ i + 1 }}/{{ total }}: {{ item.name }}</li>
  } @empty {
  <li>No items to display.</li>
  }
</ul>
```

**Implicit Variables**: `$index`, `$count`, `$first`, `$last`, `$even`, `$odd`.

### Switching Content (`@switch`)

The `@switch` block renders content based on a value. It uses strict equality (`===`) and has **no fallthrough**.

```html
@switch (status()) { @case ('loading') { <app-spinner /> } @case ('error') { <app-error-msg /> }
@case ('success') { <app-data-grid /> } @default {
<p>Unknown status</p>
} }
```

**Exhaustive Type Checking**: Use `@default never;` to ensure all cases of a union type are handled.

```html
@switch (state) { @case ('on') { ... } @case ('off') { ... } @default never; // Errors if a new
state like 'standby' is added }
```

## Core Concepts

- **Host Element**: The DOM element that matches the component's selector.
- **View**: The DOM rendered by the component's template inside the host element.
- **Standalone**: By default, components are standalone (since Angular 19, `standalone: true` is default). For older versions, `standalone: true` must be explicit or the component must be part of an `NgModule`.
- **Component Tree**: Angular applications are structured as a tree of components, where each component can host child components.
- **Component Naming**: Do not add suffixes the `Component` suffix for Component classes (e.g., AppComponent) unless the project has been configured to use that naming configuration.

## Class Body Conventions

### Member Ordering

Group Angular-specific properties together, near the top of the class, before methods: injected dependencies, inputs, outputs, and queries. This makes the component's template API and dependencies easy to find at a glance.

```ts
export class UserProfile {
  // 1. Injected dependencies
  private readonly router = inject(Router);

  // 2. Inputs, outputs, models, queries
  readonly userId = input.required<string>();
  readonly userSaved = output<void>();

  // 3. Other properties and computed state
  protected readonly displayName = computed(() => `User #${this.userId()}`);

  // 4. Methods
  save() {
    /* ... */
  }
}
```

### Keep Components Focused on Presentation

Code inside a component or directive should relate to the UI it renders. Refactor logic that makes sense on its own — form validation rules, data transformations, formatting — into separate functions or classes rather than inlining it in the class.

### Avoid Complex Logic in Templates

Templates support JavaScript-like expressions, so straightforward logic (property access, simple conditionals, method calls) belongs directly in the template. When an expression grows too complex to read at a glance, move it into the TypeScript class, typically as a `computed()`:

```ts
// Avoid: complex boolean logic buried in the template
// template: `@if (user.role === 'admin' && user.active && !user.suspended) { ... }`

// Prefer: named computed signal
protected readonly canManage = computed(
  () => this.user().role === 'admin' && this.user().active && !this.user().suspended,
);
```

### `protected` for Template-Only Members

A class's `public` members are its API surface, reachable via DI and queries. Any member that exists only to be read from the component's own template should be `protected`, not `public`:

```ts
export class UserProfile {
  readonly firstName = input();
  readonly lastName = input();

  // Not part of the component's public API, only used in its template.
  protected readonly fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
}
```

### `readonly` for Angular-Assigned Properties

Mark properties that Angular initializes as `readonly` so nothing accidentally overwrites the value Angular sets. This applies to signal-based `input()`, `model()`, `output()`, and queries (`viewChild`, `contentChildren`, etc.):

```ts
export class UserProfile {
  readonly userId = input();
  readonly userSaved = output();
  readonly userName = model();
}
```

**Decorator exception**: for the legacy decorator-based `@Input()`, `@Output()`, and query APIs, this rule applies to `@Output()` properties and query results — **not** to `@Input()` properties, since Angular reassigns those directly rather than through a signal wrapper.

### Naming Event Handlers

Name event handlers for the action they perform, not the DOM event that triggered them:

```html
<!-- Prefer -->
<button (click)="saveUserData()">Save</button>

<!-- Avoid -->
<button (click)="handleClick()">Save</button>
```

For keyboard events, use Angular's key event modifiers to name the handler after the specific key combination's action:

```html
<textarea (keydown.control.enter)="commitNotes()" (keydown.control.space)="showSuggestions()"></textarea>
```

**Exception**: when handling logic is long or branches on multiple keys/modifiers, it's fine to fall back to a generic handler name (e.g. `handleKeydown`) and delegate internally:

```ts
handleKeydown(event: KeyboardEvent) {
  if (event.ctrlKey) {
    if (event.key === 'B') {
      this.activateBold();
    } else if (event.key === 'I') {
      this.activateItalic();
    }
  }
}
```

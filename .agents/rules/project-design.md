---
trigger: glob
globs: "**/*.{html,css,scss}"
---

# Design System

This file serves as the single source of truth for styling and design implementation in the application.

## 1. Core Philosophy

- **Angular Material First**: Let Angular Material handle styles, colors, text sizes, and shadows.
- **Tailwind Utility**: Use Tailwind CSS for layout and spacing, but **NEVER** for colors (e.g., no `text-white`, `text-red-500`) or specific shadows.
- **CSS Variables**: Rely on mapped CSS variables (e.g., `var(--mat-sys-primary)`) for custom elements.

## 2. Typography

Most Angular Material components are already styled. For non-Material elements, use the following classes:

### Display

- `font-display-lg`
- `font-display-md`
- `font-display-sm`

### Headline

- `font-headline-lg`
- `font-headline-md`
- `font-headline-sm`

### Title

- `font-title-lg`
- `font-title-md`
- `font-title-sm`

### Body

- `font-body-lg`
- `font-body-md`
- `font-body-sm`

### Label

- `font-label-lg`
- `font-label-md`
- `font-label-sm`

## 3. Colors & Theming

### Text & Backgrounds (Non-Material Components)

Use the mapped Tailwind classes which reference Angular Material system variables.
defined in `src/tailwind.css`

**Primary:**

- `text-primary`
- `bg-primary`
- `text-on-primary`
- `text-primary-container`
- `bg-primary-container`
- `text-on-primary-container`

**Secondary:**

- `text-secondary`
- `bg-secondary`
- `text-on-secondary`
- `text-secondary-container`
- `bg-secondary-container`
- `text-on-secondary-container`

**Tertiary:**

- `text-tertiary`
- `bg-tertiary`
- `text-on-tertiary`
- `text-tertiary-container`
- `bg-tertiary-container`
- `text-on-tertiary-container`

**Error:**

- `text-error`
- `bg-error`
- `text-on-error`
- `text-error-container`
- `bg-error-container`
- `text-on-error-container`

**Surface:**

- `text-surface`
- `bg-surface`
- `text-on-surface`
- `bg-surface-variant`
- `text-on-surface-variant`
- `bg-inverse-surface`
- `text-inverse-on-surface`

### Component Status Themes

To apply status-specific styling (Success, Warning, Info) to components (like buttons or containers), add these attributes. They cascade to child elements.

- `theme="success"` (Spring Green palette)
- `theme="warning"` (Yellow palette)
- `theme="info"`    (Azure palette)

Defined in: `src/styles/_status.scss`

> [!CAUTION]
> **Button Styling Rule:**
>
> - **INVALID:** `<button matButton="tonal" color="warning">` (Targeting `color` input invalidates custom themes).
> - **INVALID:** `<button matIconButton color="success">`.
> - **VALID:** `<button matButton="tonal" theme="warning">`.
> - **VALID:** `<button matIconButton theme="success">`.

### Icons

For standalone icons that need specific status coloring:

- `color="lighter"`: Lighter interaction state.
- `color="success"`: Green.
- `color="warning"`: Yellow.
- `color="info"`: Blue.

Defined in: `src/styles/_overrides.scss`

## 4. Snackbars

Use these classes when opening SnackBars to enforce consistent coloring:

- `success-snackbar`
- `warning-snackbar`
- `info-snackbar`
- `error-snackbar`

Defined in: `src/styles/_overrides.scss`

## 5. Shadows

For non-Material components, use the following shadow classes:

- `shadow-mat-1`
- `shadow-mat-2`
- `shadow-mat-3`
- `shadow-mat-4`
- `shadow-mat-5`

Defined in: `src/tailwind.css`

## 6. Buttons

We follow a specific syntax for button variants using the `matButton` input or `matIconButton` directive:

- **Tonal:** `<button matButton="tonal">Action</button>`
- **Outlined:** `<button matButton="outlined">Action</button>`
- **Filled:** `<button matButton="filled">Action</button>`
- **Elevated:** `<button matButton="elevated">Action</button>`
- **Text:** `<button matButton="text">Action</button>` (or just `mat-button` for default)
- **Icon Button:** `<button matIconButton><mat-icon>home</mat-icon></button>`

> [!TIP]
> Combine these with `theme="..."` to apply status colors (e.g., `<button matButton="tonal" theme="warning">`).
> [!IMPORTANT]
> **STRICT BUTTON STYLING RULE:**
>
> - **NEVER** use the color attribute (e.g., color=\ primary\, color=\warn\) on Material buttons.
> - **ALWAYS** use the theme attribute (e.g., theme=\success\, theme=\warning\) for all color applications.

## 7. Styling Modifiers (Important)

- **Suffix ! for Important**: When applying `!important` via Tailwind/CSS utilities, ALWAYS use the suffix `!` instead of the prefix `!`.
  - ✅ **USE**: `shadow-sm!`, `rounded-xl!`, `bg-primary!`.
  - 🛑 **AVOID**: `!shadow-sm`, `!rounded-xl`, `!bg-primary`.

## 8. Icons

- **Resizing**: Angular Material icons require both `font-size` and dimensions (`width`/`height`) to be set.
- **Pattern**: MUST use the format `size-{X}! text-[{X}px]!` where X is the same size.
  - Example (Small): `class="size-4! text-[16px]!"`
  - Example (Large): `class="size-10! text-[40px]!"`
- **Avoid Scale**: Do not use `scale-*` (e.g. `scale-150`) for static sizing.
  - ❌ `scale` affects visuals but NOT layout space, causing overlaps or ghost margins.
  - ✅ Explicit sizing ensures the element occupies the correct space in the DOM flow.

## 9. Automated Audit
>
> **Use the `apply-design` skill to automatically fix violations of these rules.**

---
name: design-system
description: Applies the Design System rules for visual consistency. Use it for SCSS, CSS, Tailwind, styles, colors, icons, layout, or Material requests. Enforces strict Tailwind v4 + Angular Material integration. Do not use for core framework logic or non-UI tasks.
---

# 🎨 Apply Design System Skill

This skill is the **Design Authority** for the project. It enforces visual consistency, semantic token usage, and strict Tailwind v4 + Angular Material integration.

## ⚡ Core Philosophy

1. **Compose, Don't Custom**: We do not write custom CSS. We compose utilities.
2. **Structure**: Angular Material (Components).
3. **Layout/Spacing**: Tailwind CSS (Utilities).
4. **Theming**: CSS Variables (Design Tokens).
5. **No "Magic Values"**: Use semantic names (`primary`, `surface`) over raw hex codes.

## 🌊 Rules of Engagement

### 1. Tailwind CSS v4+

- **No Config**: Do not ask for `tailwind.config.js`. v4 is config-less.
- **Important Syntax**: Use suffix `hidden!` (NOT prefix `!hidden`).
- **Opacity Syntax**: Use slash `bg-black/50` (NOT `bg-opacity-50`).
- **Sizing**: Use `size-10` instead of `w-10 h-10`.

### 2. Angular Material Integration

- **No Overrides**: NEVER use `::ng-deep`. Use global theme variables or view encapsulation with a unique host class.
- **Density**: Prefer `matButton="elevated"` or density scale `-2` for data-heavy views.
- **Colors**: Use Material Tokens via CSS variables (`var(--mat-sys-primary)`), never hardcoded colors.
- **Strict No-Custom-Style Policy**: If using an Angular Material component (`mat-toolbar`, `mat-button`, `mat-menu`, `mat-list`, etc.), do NOT add any extra custom styles (e.g., Tailwind classes, custom CSS) to it. Rely SOLELY on the component's native inputs (like `matButton="filled"`, `color="..."`) or the provided Design System thematic tokens. The component already has its own style; do not override it.

## 🎯 Audit & Action Guide

Use this checklist to "fix" UI components that drift from the design system.

### 🔠 Typography Audit

Replace generic Tailwind classes with Semantic Typography Utilities.

| Generic (Forbidden)      | Semantic Replacement (Required)                       |
| :----------------------- | :---------------------------------------------------- |
| `text-3xl`, `font-bold`  | `font-headline-lg`                                    |
| `text-xl`, `font-medium` | `font-title-md`                                       |
| `text-sm`                | `font-label-md` or `font-body-sm`                     |
| `font-bold` (standalone) | _Remove, or use specific weight utility if justified_ |

### 🖼️ Icon Strategy (Custom Directive)

We use a custom `MatIconDirective` located in `src/app/shared/ui/mat-icon`.
This directive standardizes icon types (outline vs fill), sizing, and colors, providing strict typing and autocomplete.

**Mandatory Usage:**

1. **Name**: Use `name=""` (REQUIRED).
   - ❌ `<mat-icon>home</mat-icon>` (Do NOT use content projection).
   - ✅ `<mat-icon name="home"/>` (Use the `name` input with a closing tag).

2. **Color**: Use `iconColor=""` (NOT `color=""`).
   - We alias the input to `iconColor` to avoid conflicts with Angular Material's native `color` input and ensuring our custom Design System colors work correctly.
   - The type `Color` provides autocomplete for strict tokens (`primary`, `success`, `error`, etc.).
   - ❌ `<mat-icon color="primary"/>` (Do NOT use the native color input).
   - ✅ `<mat-icon iconColor="primary"/>` (Uses the design system token).

3. **Sizing**: Use the `size` input with t-shirt scales.
   - **Default is `2xl`**: Use this for standard icons. **OMIT** the `size` input unless deviating.
   - ✅ `<mat-icon name="home"/>` (Preferred - Defaults to `2xl`).
   - ✅ `<mat-icon name="home" size="4xl"/>` (Only when overriding default).
   - Supported sizes: `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, ... `7xl`.

4. **Fill/Solid**: Use `type="fill"`.
   - ✅ `<mat-icon name="home" type="fill"/>` (Adds `ms-fill` class).

5. **No Hacks**:
   - ❌ `scale-125` (Forbidden: Use proper `size`).
   - ❌ `text-[20px]` (Forbidden: Use proper `size`).

### 🔘 Button & Badge Audit

**Material 3 Syntax**:
**Mechanism**: The `matButton="..."` attribute controls the button's visual hierarchy.
It automatically applies the correct design tokens and classes, ensuring consistency across the application.

- `mat-flat-button` -> `matButton="filled"`
- `mat-stroked-button` -> `matButton="outlined"`
- `mat-raised-button` -> `matButton="elevated"`
- `mat-button` -> `matButton="text"`
- _Note: `matIconButton` remains as a directive._

**Coloring**:

- ❌ `color="primary"` (Legacy)
- ✅ `theme="info"` / `theme="success"` / `theme="warning"` / `theme="error"` (Custom Attribute Directive)

**Badges**:

**Badges (`app-status-badge`)**:

We use a **Configuration-Driven** approach. Do not color badges manually.

1. **Define Config**: Create a `Record<string, StatusConfig>` in your component.

   ```typescript
   protected readonly statusConfig = {
     active: { color: 'green', icon: 'check' },
     banned: { color: 'red', icon: 'block' }
   };
   ```

2. **Bind in Template**:

   ```html
   <app-status-badge [value]="status" [statusConfig]="statusConfig" />
   ```

3. **Behavior**:
   - **Colors**: Mapped automatically (green, yellow, red, blue, gray).
   - **Icons**: Mapped automatically (optional).
   - **Label**: Auto-titled from value (`active` -> "Active") or overridden via config.

## 🧪 Verification

After applying changes, verify:

1. **Grep `text-xl`**: Should be 0 results (replaced by `font-title-*`).
2. **Grep `!important`**: Should be 0 results (replaced by `class!`).
3. **Grep `<mat-icon>` content**: Should be 0 results (e.g., `<mat-icon>home</mat-icon>` is forbidden). All icons must use `name="home"`.
4. **Visual Check**: Icons are aligned, typography uses the design system font.

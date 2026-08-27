---
name: apply-design
description: The single source of truth for Design System rules (Tailwind v4 + Material). Audits and refactors HTML/CSS to match strict Project Design rules (Typography, Icons, Buttons, Colors).
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

### 🖼️ Icon Sizing Fix

Default size (24px) is standard. Only enforce explicit sizing when deviating from default.

- ✅ `<mat-icon>home</mat-icon>` (Defaults to 24px)
- ❌ `<mat-icon class="scale-125">home</mat-icon>` (Do not use scale; use explicitly sized classes)
- ✅ `<mat-icon class="size-5! text-[20px]!">home</mat-icon>` (For custom sizes)

**Pattern (Only if resizing)**: `<mat-icon class="size-{X}! text-[{X}px]!">name</mat-icon>`

### 🔘 Button & Badge Audit

**Material 3 Syntax**:

- `mat-flat-button` -> `matButton="filled"`
- `mat-stroked-button` -> `matButton="outlined"`
- `mat-raised-button` -> `matButton="elevated"`
- `mat-button` -> `matButton="text"`
- _Note: `matIconButton` remains as a directive._

**Coloring**:

- ❌ `color="primary"` (Legacy)
- ✅ `theme="primary"` / `theme="success"` / `theme="danger"` (Custom Attribute Directive)

**Badges**:

- Ensure `app-status-badge` uses the `[status]` input, not raw color classes.

## 🧪 Verification

After applying changes, verify:

1. **Grep `text-xl`**: Should be 0 results (replaced by `font-title-*`).
2. **Grep `!important`**: Should be 0 results (replaced by `class!`).
3. **Grep `scale-` on icons**: Should be 0 results (replaced by explicit sizing).
4. **Visual Check**: Icons are aligned, typography uses the design system font.

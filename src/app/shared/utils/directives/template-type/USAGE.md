# TemplateType Directive - Usage Guide

## ⚠️ **Critical: You Must Import This Directive!**

For type checking to work, you **MUST** import `TemplateTypeDirective` in **EVERY** component that uses it.

---

## ✅ Correct Usage

### Step 1: Import Both DataState and TemplateTypeDirective

```typescript
import { Component, signal } from '@angular/core';
import { DataState } from '@shared/components/data-state/data-state';
import { TemplateTypeDirective } from '@shared/utils/template-type/template-type.directive';
import { MyDataType } from './types';

@Component({
  selector: 'my-component',
  imports: [
    DataState,
    TemplateTypeDirective, // ⚠️ MUST import this!
    // ... other imports
  ],
  templateUrl: './my-component.html',
})
export class MyComponent {
  isLoading = signal(true);
  data = signal<MyDataType | null>(null);
  error = signal<string | null>(null);
}
```

### Step 2: Use [templateType] in Your Template

```html
<data-state [isLoading]="isLoading()" [data]="data()" [error]="error()" [dataTemplate]="template">
</data-state>

<!-- Add [templateType]="data()!" to enable type checking -->
<ng-template #template [templateType]="data()!" let-item>
  {{ item.validProperty }}
  <!-- ✅ Works -->
  {{ item.invalidProperty }}
  <!-- ❌ TypeScript Error -->
</ng-template>
```

---

## ❌ Common Mistakes

### Mistake 1: Forgetting to Import the Directive

```typescript
// ❌ WRONG - Type checking won't work!
@Component({
  imports: [DataState] // Missing TemplateTypeDirective
})
```

```typescript
// ✅ CORRECT
@Component({
  imports: [DataState, TemplateTypeDirective]
})
```

### Mistake 2: Forgetting [templateType] Attribute

```html
<!-- ❌ WRONG - No type checking -->
<ng-template #template let-item>
  {{ item.anything }}
  <!-- No error, even if property doesn't exist -->
</ng-template>
```

```html
<!-- ✅ CORRECT -->
<ng-template #template [templateType]="data()!" let-item>
  {{ item.validProperty }}
  <!-- Type checked! -->
</ng-template>
```

### Mistake 3: Not Using Typed Signals

```typescript
// ❌ WRONG - Type is 'any'
data = signal(null);
```

```typescript
// ✅ CORRECT - Explicit type
data = signal<MyType | null>(null);
```

---

## 🔍 How It Works

1. **You import the directive** in your component's imports array
2. **Angular's template compiler** sees the directive is available
3. **The `ngTemplateContextGuard`** tells TypeScript what type to use
4. **TypeScript checks** all property access in the template
5. **You get errors** at compile time if you use invalid properties

---

## 📋 Quick Checklist

Before using DataState with type checking:

- [ ] Import `DataState` from `@shared/components/data-state/data-state`
- [ ] Import `TemplateTypeDirective` from `@shared/utils/template-type/template-type.directive`
- [ ] Add both to the component's `imports` array
- [ ] Use typed signals: `signal<YourType | null>(null)`
- [ ] Add `[templateType]="data()!"` to the `<ng-template>`
- [ ] Use `let-item` (or any variable name) in the template

---

## 💡 Pro Tips

### Tip 1: Use Autocomplete

When you type `item.` in the template, your IDE will show all available properties!

### Tip 2: Refactoring Safety

If you change your data type, TypeScript will show errors in all templates that need updating.

### Tip 3: Catch Typos Early

Typos like `item.nmae` instead of `item.name` are caught at compile time.

### Tip 4: Works with Arrays

```typescript
items = signal<Product[] | null>(null);
```

```html
<ng-template #template [templateType]="items()!" let-products>
  @for (product of products; track product.id) { {{ product.name }}
  <!-- ✅ Type checked -->
  }
</ng-template>
```

---

## 🚀 Copy-Paste Template

Use this as a starting point for any component:

```typescript
import { Component, signal } from '@angular/core';
import { DataState } from '@shared/components/data-state/data-state';
import { TemplateTypeDirective } from '@shared/utils/template-type/template-type.directive';
import { YourType } from './types';

@Component({
  selector: 'your-component',
  imports: [DataState, TemplateTypeDirective],
  template: `
    <data-state [isLoading]="isLoading()" [data]="data()" [error]="error()" [dataTemplate]="template">
    </data-state>

    <ng-template #template [templateType]="data()!" let-item>
      <!-- Your typed template here -->
      {{ item.property }}
    </ng-template>
  `,
})
export class YourComponent {
  isLoading = signal(true);
  data = signal<YourType | null>(null);
  error = signal<string | null>(null);
}
```

---

## 🐛 Troubleshooting

### "Property does not exist" Error

✅ **This is good!** It means type checking is working. Fix the property name.

### No Type Checking / No Errors

Check:

1. Did you import `TemplateTypeDirective`?
2. Is it in the component's `imports` array?
3. Did you add `[templateType]="data()!"`?
4. Is your signal typed: `signal<Type | null>(null)`?

### "TemplateTypeDirective is not used" Warning

This is a false positive from Angular's linter. The directive IS being used in your template. You can safely ignore this warning.

---

## 📚 See Also

- [DataState Component README](../../components/data-state/README.md)
- [Type Definitions](@shared/types/)
- [Angular Template Type Checking](https://angular.dev/guide/template-typecheck)

---
description: Translate a page or section to support multiple languages
---

# Follow these steps to translate a new section

> [!IMPORTANT]
> This application uses a single, unified standard: **colocated `<feature>.content.ts`** dictionaries in pure TypeScript.
> Runtime JSON files and Transloco pipes are prohibited.

1. **Locate or Create Content File**:
   Open or create `<feature-name>.content.ts` colocated in the feature or component directory (e.g. `src/app/features/pricing/pricing.content.ts`).

2. **Add English and Arabic Text**:
   Define the structure in both `en` and `ar`:

   ```typescript
   export const PRICING_CONTENT = {
     en: {
       title: 'Predictable Pricing',
       cta: 'Choose Plan',
     },
     ar: {
       title: 'أسعار واضحة ومحددة',
       cta: 'اختر الخطة',
     },
   } as const;
   ```

3. **Expose in Component via Signal**:
   In `<feature-name>.component.ts`:

   ```typescript
   readonly #lang = inject(LangService);
   protected readonly t = computed(() => PRICING_CONTENT[this.#lang.currentLang()]);
   ```

4. **Bind in Template**:
   In `<feature-name>.component.html`:

   ```html
   <h1>{{ t().title }}</h1>
   <button>{{ t().cta }}</button>
   ```

5. **Verify**:
   Run `npm test` to confirm everything compiles and passes tests cleanly.

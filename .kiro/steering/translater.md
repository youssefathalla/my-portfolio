---
inclusion: auto
name: translater
description: Translate a component, page, or section into multiple languages. Use when extracting literal strings from templates into transloco keys, or when adding or updating entries in public/i18n/en.json and public/i18n/ar.json.
---

# Follow these steps to translate a new section

1. **Identify Text**: Find literal strings in the component's HTML template that need translation.
2. **Key Creation**: Create a unique key for the text (e.g., `dashboard.welcome_message`). Use camelCase or dot notation.
3. **Update JSON Files**:
    - Open `public/i18n/en.json` and add the key/value pair.
    - Open `public/i18n/ar.json` and add the Arabic translation.
4. **Apply Pipe**: In the HTML template, replace the literal text with the key and the transloco pipe:

   ```html
   <span>{{ 'key.path' | transloco }}</span>
   ```

   Import `TranslocoPipe` (or `TranslocoDirective`) from `@jsverse/transloco` in the component's `imports`.

5. **Sync Both Locales**: Run the `sync-i18n` skill's script so `en.json` and `ar.json` stay key-identical and sorted:

   ```bash
   node .kiro/skills/sync-i18n/scripts/sync.js
   ```

   Then replace any `__MISSING_TRANSLATION__` placeholder it inserted with a real translation.

6. **Verify**: Run `npm run lint` to confirm nothing broke.

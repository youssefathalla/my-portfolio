---
description: Translate a page or section to support multiple languages
---

# Follow these steps to translate a new section

1. **Identify Text**: Find literal strings in the component's HTML template that need translation.
2. **Key Creation**: Create a unique key for the text (e.g., `dashboard.welcome_message`). Use camelCase or dot notation.
3. **Update JSON Files**:
    - Open `public/i18n/en.json` and add the key/value pair.
    - Open `public/i18n/ar.json` and add the Arabic translation.
    - Open `public/i18n/ml.json` and add the Hindi translation.
4. **Apply Pipe**: In the HTML template, replace the literal text with the key and the transloco pipe:

   ```html
   <span>{{ 'key.path' | transloco }}</span>
   ```

// turbo
5. Run `ng lint` to ensure no issues were introduced.

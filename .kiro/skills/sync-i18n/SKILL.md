---
name: sync-i18n
description: Synchronizes en.json, ar.json, and hi.json translation files by adding missing keys and sorting them.
---

# 🌍 I18n Synchronization Skill

This skill ensures that your English (`en.json`), Arabic (`ar.json`), and Hindi (`hi.json`) translation files remain perfectly synchronized. It prevents runtime missing translation errors and keeps the codebase clean.

## 🚦 When to use this skill

Use this skill when:

1. The user reports "missing translations" or "raw keys" showing up in the UI.
2. You have added new text literals to a component and need to generate keys.
3. You want to ensure `en.json`, `ar.json`, and `hi.json` are consistent.

## 🎯 Objective

1. **Sync Keys**: Ensure every key exists in *all* language files.
2. **Mark Missing**: Fill missing translation values with `__MISSING_TRANSLATION__` so they are easily searchable.
3. **Sort**: Alphabetize keys to prevent git merge conflicts.

## 🛠️ Execution Steps

### 1. Read Translation Files

- Scan `public/i18n/*.json` to find all available languages (e.g., `en.json`, `ar.json`, `hi.json`).

### 2. Compare & Update

Perform a deep merge logic (mentally or via script):

- **Deep Walk**: Traverse the JSON structure.
- **Missing in AR**: If `en.section.key` exists but `ar.section.key` does not, add it to `ar` with value `__MISSING_TRANSLATION__`.
- **Missing in EN**: If `ar.section.key` exists but `en.section.key` does not, add it to `en` with value `__MISSING_TRANSLATION__`.
- **Type Mismatch**: If a key is a string in one but an object in another, flag this as a critical error to the user.

### 3. Sort Keys

Sort all keys alphabetically at every level of nesting.
*Example:*

```json
{
  "auth": { ... },
  "dashboard": { ... },
  "settings": { ... }
}
```

### 4. Write Back

Write the formatted, sorted JSON strings back to their respective files using `write_to_file`.
**Important**: Use 2-space indentation.

## 🧪 Verification

After running, strictly verify:

1. Both files are valid JSON.
2. No keys were accidentally deleted.

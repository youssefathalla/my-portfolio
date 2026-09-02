---
name: clean-up
description: Automated post-feature audit triggered after completing any feature, refactor, or before opening a pull request / committing changes.
---

# Purpose

Run a post-feature audit on modified or newly created files (working directory / active `git diff`) to catch dead code, security gaps, performance issues, regression risks, and missing test coverage before the change ships.

## Scope

Strictly analyze modified or newly created files in the working directory / active `git diff`. Do not audit untouched legacy files.

## 🎯 Audit Checklist

### 1. Code Hygiene & Cleanup

- **Dead Code:** Detect unused imports, unreferenced variables/types, unreachable code paths, leftover debugging statements (`console.log`, `print`, debugger), and stale TODOs.
- **Duplicate Logic:** Identify copied helper functions, repeated patterns, or redundant boilerplate across touched files; suggest consolidated utilities.
- **Unused Components & Assets:** Detect orphaned components, directives, pipes, unused CSS/Tailwind classes, or mock data created during prototyping.
- **Complexity Reduction:** Flag over-engineered abstractions, deeply nested conditionals, and redundant state layers. Prioritize declarative, readable, and idiomatic solutions.
- → Reported under 🟢 **CLEANUP**.

### 2. Security & Resilience

- **Security Verification:** Ensure input validation/sanitization is robust against injection/XSS. Verify authentication and authorization guards on new routes/endpoints. Check that no secrets, API keys, or sensitive data are exposed in client-side bundles or logs.
- → Reported under 🔴 **BLOCKER**.

### 3. Performance & Efficiency

- **Execution & Rendering:** Minimize time/space complexity. Eliminate unnecessary re-renders, compute bottlenecks, unmanaged subscriptions/listeners, memory leaks, and excessive payload sizes.
- → Reported under 🟡 **EFFICIENCY & PERFORMANCE**.

### 4. Regression & Impact Analysis

- **Regression Risks:** Identify potential breaking changes in shared contracts, dependent modules, global state slices, or event listeners.
- → Reported under 🔴 **BLOCKER**.

### 5. Pre-Ship Test Coverage

- **Targeted Testing:** Define essential unit, integration, or edge-case tests (happy paths, boundary conditions, and failure states) required before shipping.
- → Reported under 🧪 **TEST COVERAGE**.

## ⚙️ Execution Directives

- **Diff-Only Constraint:** Focus exclusively on the changes made in the current feature branch / diff (see Scope above). Do not audit untouched legacy files.
- **Direct Solutions:** Provide concrete, copy-pasteable replacement code or unified diffs for all identified issues.
- **Concise & Direct:** Omit filler commentary. If a category is clean, mark it with `✅ Clean` in a single line.
- **Verification:** Ensure no breaking changes to active functionality before applying deletions.

## 📋 Required Report Format

When executing this audit, format the output strictly using the structure below (the outer wrapper uses 4 backticks so the inner `ts`/`diff` fences nest correctly — do not collapse it to 3):

````markdown
# 📋 Post-Feature Audit Report

### 🔴 [BLOCKER] — Must Fix Before Commit

> _Critical security vulnerabilities, broken contracts, or high regression risks._

- **Issue:** [Description of the blocker]
- **File:** `path/to/file.ext:line`
- **Recommended Fix:**

```ts
// Replacement or fix snippet
```

---

### 🟡 [EFFICIENCY & PERFORMANCE] — Recommended Optimizations

> _Avoidable overhead, unnecessary re-renders, memory leaks, or compute bottlenecks._

- **Finding:** [Description of the performance issue]
- **File:** `path/to/file.ext:line`
- **Suggested Improvement:**

```ts
// Optimized snippet
```

---

### 🟢 [CLEANUP] — Dead Code & Complexity

> _Unused imports, duplicated logic, dead components, or simplification opportunities._

- **Target:** [Unused import / duplicate helper / over-engineered logic]
- **File:** `path/to/file.ext`
- **Action / Diff:**

```diff
- removeOldOrphanedLogic();
```

---

### 🧪 [TEST COVERAGE] — Pre-Ship Tests

> _Essential unit, integration, or edge-case tests needed before shipping._

- **Gap:** [Missing test scenario]
- **File:** `path/to/file.spec.ext`
- **Suggested Test:**

```ts
// Test snippet
```
````

</content>

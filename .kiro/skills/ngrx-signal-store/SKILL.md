---
name: ngrx-signal-store
description: Expert in NgRx SignalStore. Use ONLY when the user explicitly asks for "Global State", "SignalStore", "NgRx", or "Shared Data" management.
---

# 📦 NgRx SignalStore Beast Mode

## ⚡ The "withProps" Mandate

**NEVER** use `inject()` inside `withMethods` or `withComputed`.
You **MUST** use `withProps` to consolidate all dependencies at the top of the store pipeline.

- **Why?** It keeps logic clean, makes mocking dependencies trivial, and serves as a "Manifest" of what the store uses.

## 🏗️ Architectural Rules

### 1. Structure Order (Strict)

Define your store in this exact order:

1. `withState` (Data)
2. `withEntities` (Collections)
3. `withProps` (Dependencies 💉)
4. `withComputed` (Derived)
5. `withMethods` (Actions)
6. `withHooks` (Lifecycle)

### 2. Async Actions (`rxMethod`)

- Use `rxMethod` for **ANY** side effect (API calls, debounce, tap).
- **Pipe Operator**: Always pipe the input: `rxMethod<void>(pipe(...))`.
- **Context**: Use the injected services from `withProps`.

### 3. Entity Management

- **Collections**: If managing a list, ALWAYS use `withEntities<T>()`.
- **Updaters**: Use `patchState(store, setAllEntities(...))` or `addEntity`.

### 4. Lifecycle

- **Initialization**: Use `withHooks { onInit }` to trigger initial data loads. **DO NOT** call methods in the constructor of the component using the store. The store should own its startup logic.

## 🧪 Testing Strategy

- Because you used `withProps`, you can easily override dependencies using the `{ providers: [] }` option in `TestBed` or by mocking the factory if using functional creation.

# 📦 SignalStore Cheat Sheet

| Feature                  | ❌ Legacy / Banned                     | ✅ Beast Mode Pattern                                   |
| :----------------------- | :------------------------------------- | :------------------------------------------------------ |
| **Dependency Injection** | `inject(Service)` inside `withMethods` | `withProps(() => ({ api: inject(ApiService) }))`        |
| **State Updates**        | `store.update()` (Manual)              | `patchState(store, { loading: true })`                  |
| **Async Logic**          | Methods returning Observables          | `rxMethod<Type>(pipe(switchMap...))`                    |
| **Collections**          | `users: User[]` in state               | `withEntities<User>()`                                  |
| **Selectors**            | `computed(() => store.x())` (Manual)   | `withComputed(({ x }) => ({ doubleX: computed(...) }))` |
| **Lifecycle**            | Component `ngOnInit` calls store       | `withHooks({ onInit: (store) => store.load() })`        |

## 💉 The `withProps` Injection Pattern

```typescript
// ✅ DO THIS
withProps(() => ({
  authService: inject(AuthService),
  logger: inject(LoggerService)
})),
withMethods((store) => ({
  login: () => store.authService.login() // Clean access
}))

// ❌ DO NOT DO THIS
withMethods((store) => {
  const auth = inject(AuthService); // Hidden dependency 🤮
  return { ... }
})
```

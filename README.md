# Youssef Fathalla — Portfolio & Service Platform

[![Angular](https://img.shields.io/badge/Angular-v22-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v11-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vitest](https://img.shields.io/badge/Vitest-v4-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/license-Private-red)](<>)

Production portfolio, engineering showcase, and client engagement platform for **Youssef Fathalla** (Senior Front-End Engineer & Web Application Specialist).

🌐 **Live Website:** [https://youssefathalla.com](https://youssefathalla.com)

---

## ⚡ Key Highlights & Architecture

- **Angular v22 (Zoneless & Signal-First):** Built entirely around Angular Signals (`signal()`, `computed()`, `input()`, `output()`), modern template control flow (`@if`, `@for`, `@let`, `@switch`), and zero `Zone.js` overhead.
- **Server-Side Rendering (SSR) & Prerendering:** Powered by `@angular/ssr` and Express with localized prerendered routes for instant First Contentful Paint and optimal SEO.
- **Bilingual i18n (EN / AR):** Native English and Arabic language support with complete right-to-left (RTL) layout switching and localized routing (`/` and `/ar/`).
- **Tailwind CSS v4 + Angular Material M3:** Config-less Tailwind v4 styling paired with Material 3 design tokens and accessible component foundations.
- **GSAP Animations:** Smooth micro-interactions, page transitions, and interactive visual components.
- **Zero-Dependency Shared Contracts:** `shared/submission-schema/` provides a pure TypeScript schema shared between the Angular frontend and backend Cloud Functions.
- **Firebase & Cloud Functions:** Direct Firestore integration, automated transaction notifications, spam heuristics, and rate limiting running on Node.js 22.
- **Strict Quality Gates:** Automated build guards, secret scanning, zero-`any` enforcement, and production bundle budget verification.

---

## 📂 Project Structure

```text
├── public/                      # Static assets, fonts, sitemaps, and robots.txt
├── src/
│   ├── app/
│   │   ├── admin/               # Internal management dashboard (auth, submissions, export)
│   │   ├── core/                # Singleton services (SEO, i18n, Firebase, routing, analytics)
│   │   ├── features/            # Feature pages (landing, services, case studies, contact, playground)
│   │   ├── layout/              # Structural shells (site navigation, public shell, footer)
│   │   └── shared/              # Reusable UI components, directives, pipes, and utility functions
│   ├── environments/            # Environment configurations (dev vs prod)
│   ├── styles/                  # Design tokens, typography, and Material 3 overrides
│   └── main.ts                  # Application entry point
├── shared/
│   └── submission-schema/       # Pure TypeScript document schema shared across frontend & backend
├── functions/                   # Firebase Cloud Functions (notifications, rate limits, webhooks)
│   └── src/
├── scripts/                     # Prebuild guards, sitemap generators, and integrity assertions
├── firestore.rules              # Granular Firestore security rules
└── angular.json                 # Angular CLI workspace configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v22.x` or higher
- **npm**: `v11.x` or higher

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/YousseFathalla/angular-lab.git portfolio
cd portfolio
npm install
```

---

## 🛠️ Available Scripts

| Command                      | Description                                                                                        |
| :--------------------------- | :------------------------------------------------------------------------------------------------- |
| `npm start` or `npm run dev` | Starts the Angular development server at `http://localhost:4200/` with hot-reloading               |
| `npm test`                   | Runs the full unit test suite using the native Angular Vitest builder (`@angular/build:unit-test`) |
| `npm run build`              | Executes prebuild guards, generates sitemaps, and compiles the production SSR application          |
| `npm run assert-build`       | Audits the production build directory for prerender integrity, chunk budgets, and SEO output       |
| `npm run assert-no-any`      | Enforces a strict zero-`any` TypeScript type safety rule across the codebase                       |
| `npm run lint`               | Runs ESLint checks across TypeScript and HTML files                                                |
| `npm run test:emulator`      | Tests Cloud Functions and Firestore security rules against local Firebase emulators                |
| `npm run sync:agents:check`  | Verifies that AI steering documents and `.agents/` rules are in sync                               |

---

## 🧪 Testing

Unit testing is configured with Angular's official Vitest builder and `jsdom`:

```bash
# Run all unit tests once
npm test

# Run tests in watch mode
npm test -- --watch
```

---

## 🔒 Security & Backend Emulation

Firestore Security Rules and Cloud Functions can be verified locally using the Firebase Emulator Suite:

```bash
# Start local emulators (Firestore on 8180, Auth on 9199, Functions on 5001, UI on 4100)
npx firebase emulators:start

# Run emulator-backed security test suites
npm run test:emulator
```

---

## 📬 Contact & Connect

- **Author:** Youssef Fathalla
- **Website:** [youssefathalla.com](https://youssefathalla.com)
- **LinkedIn:** [/in/youssefathalla](https://www.linkedin.com/in/youssefathalla)
- **GitHub:** [@youssefathalla](https://github.com/youssefathalla)
- **Email:** [youssefathalla@gmail.com](mailto:youssefathalla@gmail.com)

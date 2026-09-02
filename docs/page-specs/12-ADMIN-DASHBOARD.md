# Admin Dashboard Specification (`/admin/*`)

## 1. Overview & Architecture

- **Route Prefix**: `/admin` (lazy-loaded module)
- **Security & Access Control**:
  - Firebase Authentication (email/password with session persistence).
  - Firebase App Check verification on all API & Firestore interactions.
  - Strict Firestore Security Rules: read/write allowed exclusively to authenticated admin UID.
- **Client-Side Only Mode**: Excluded from static prerendering, robots indexing (`robots.txt: Disallow: /admin`), and public sitemap.

---

## 2. Views & Sub-Routes

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. `/admin/login` - Administrator Authentication View       │
├─────────────────────────────────────────────────────────────┤
│ 2. `/admin/overview` - Analytics, Metrics & Activity Pulse  │
├─────────────────────────────────────────────────────────────┤
│ 3. `/admin/submissions` - Filterable Submissions Data Table │
├─────────────────────────────────────────────────────────────┤
│ 4. `/admin/submissions/:id` - Deep Submission Inspector     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed View Specifications

### 3.1 Login Page (`/admin/login`)

- **Components**: `src/app/admin/pages/login/login-page.ts` & `login-page.html`
- **Fields**:
  - Email input (autofocus, autocomplete="username", email format validation).
  - Password input (autocomplete="current-password").
  - `Sign In` action button with loading spinner.
- **Error Handling**: Friendly error toasts for `auth/invalid-credential`, `auth/user-not-found`, and rate limits.
- **Auth Guard**: Redirects authenticated users directly to `/admin/overview`.

---

### 3.2 Admin Shell (`<app-admin-shell>`)

- **Components**: `src/app/admin/pages/shell/admin-shell.ts` & `admin-shell.html`
- **Responsive Layout**:
  - Desktop ($>1024\text{px}$): 240px persistent glass sidebar with navigation labels.
  - Mobile/Tablet ($<1024\text{px}$): 60px icon-only rail with tooltip labels.
- **Navigation Links**:
  1. `Overview` (`app-admin-icon` name="chart-bar") $\rightarrow$ `/admin/overview`
  2. `Submissions` (`app-admin-icon` name="inbox") $\rightarrow$ `/admin/submissions`
  3. `Sign Out` (`app-admin-icon` name="logout") $\rightarrow$ triggers `authService.signOut()` and redirects to `/admin/login`.
- **Header**: Shows authenticated admin email and connection status.

---

### 3.3 Overview Dashboard (`/admin/overview`)

- **Components**: `src/app/admin/pages/overview/overview-page.ts` & `overview-page.html`
- **Key Metrics Grid (4 Metric Cards)**:
  1. **Total Submissions**: All-time submission count.
  2. **Unread Inquiries**: Inquiries requiring attention (`read === false`).
  3. **This Week's Activity**: Submissions received in current ISO week.
  4. **Active Engagements**: Submissions with status `in-progress` or `accepted`.
- **Week-over-Week Visual Trend**: Interactive bar chart showing intake volume across last 8 ISO weeks.
- **Recent Submissions Quick List**: 5 most recent submissions with direct link to details.

---

### 3.4 Submissions List & Filter View (`/admin/submissions`)

- **Components**: `src/app/admin/pages/submissions-list/submissions-list-page.ts` & `submissions-list-page.html`
- **Filtering & Search Controls**:
  - **Full-text Search**: Debounced search across name, email, company, and message body.
  - **Type Filter**: Multi-select chip group (`contact`, `intake-wizard`, `booking`).
  - **Status Filter**: Multi-select chip group (`new`, `reviewing`, `contacted`, `in-progress`, `completed`, `archived`).
  - **Tag Rules Engine**: Automated tag suggestions (`high-budget`, `urgent-timeline`, `agency-partner`).
- **Data Table Capabilities**:
  - Column sorting (`createdAt`, `updatedAt`, `status`).
  - Bulk actions: Mark as Read, Bulk Status Change, Bulk Archive.
  - Pagination (10, 25, 50 rows per page).
  - Empty state illustration with reset filter shortcut.

---

### 3.5 Submission Detail Inspector (`/admin/submissions/:id`)

- **Components**: `src/app/admin/pages/submission-detail/submission-detail-page.ts` & `submission-detail-page.html`
- **Inspector Sections**:
  1. **Header & Status Pipeline**: Interactive status dropdown (`new` $\rightarrow$ `reviewing` $\rightarrow$ `contacted` $\rightarrow$ `in-progress` $\rightarrow$ `completed` $\rightarrow$ `archived`).
  2. **Sender Identity**: Name, Email (with quick `mailto:` launcher), Phone, Company, Timezone.
  3. **Intake Scope & Answers**: Project Goal, Timeline, Budget Band, Booking Slot Reference.
  4. **Full Message / Brief Body**: Formatted multiline message text.
  5. **Internal Admin Notes**: Private notes field saved directly to Firestore document.
  6. **Audit Timestamps**: Created At, Last Updated At, Read status toggle.

---

## 4. Firestore Schema & Security Rules

```typescript
interface SubmissionDocument {
  readonly id: string;
  readonly type: 'contact' | 'intake-wizard' | 'booking';
  readonly status: 'new' | 'reviewing' | 'contacted' | 'in-progress' | 'completed' | 'archived';
  readonly read: boolean;
  readonly locale: 'en' | 'ar';
  readonly tags: readonly string[];
  readonly adminNotes?: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly payload: {
    readonly name: string;
    readonly email: string;
    readonly message: string;
    readonly goal?: string;
    readonly timeline?: string;
    readonly budgetBand?: string;
    readonly bookingReference?: string;
    readonly company?: string;
  };
}
```

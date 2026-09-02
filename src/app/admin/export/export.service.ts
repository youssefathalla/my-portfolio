/**
 * Serializes filtered submission records to CSV or JSON and triggers browser download.
 * Handles count checks, large-dataset confirmation dialogs, and paginated batch fetching.
 */
import { inject, Service, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FirebaseAppService } from '../../core/firebase/firebase-app.service';
import { isBrowser } from '../../core/platform/platform';
import { buildQueryPlan, applyClientPredicates } from '../data/query-plan';
import type { FilterState, SubmissionRecord } from '../data/submission-record';
import { openAdminConfirm } from '../shared/confirm-dialog';
import type { ExportRow } from './export-row';
import { toCsv } from './csv';
import { toJson } from './json';

/** Export format supported by the service. */
export type ExportFormat = 'csv' | 'json';

/** Converts a SubmissionRecord to a plain-data ExportRow with ISO 8601 timestamps. */
function toExportRow(record: SubmissionRecord): ExportRow {
  return {
    id: record.id,
    type: record.document.type,
    status: record.document.status,
    createdAt: new Date(record.createdAtMs).toISOString(),
    updatedAt: new Date(record.updatedAtMs).toISOString(),
    read: record.document.read,
    payload: record.document.payload as Readonly<Record<string, string | number | boolean>>,
    notes: record.document.notes,
    tags: record.document.tags,
  };
}

@Service()
export class ExportService {
  private readonly firebase = inject(FirebaseAppService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowserContext = isBrowser();

  /** Tracks whether an export operation is currently in flight. */
  readonly exporting = signal(false);

  /** Exports the filtered submission dataset in CSV or JSON format. */
  async export(format: ExportFormat, filterState: FilterState): Promise<void> {
    if (!this.isBrowserContext) return;

    const db = await this.firebase.getFirestore();
    if (db === null) {
      this.snackBar.open('Export failed — database unavailable', undefined, { duration: 4000 });
      return;
    }

    this.exporting.set(true);
    try {
      await this.performExport(db, format, filterState);
    } catch {
      this.snackBar.open('Export failed', undefined, { duration: 4000 });
    } finally {
      this.exporting.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async performExport(
    db: import('firebase/firestore').Firestore,
    format: ExportFormat,
    filterState: FilterState,
  ): Promise<void> {
    const {
      collection,
      query,
      where,
      orderBy,
      getCountFromServer,
      getDocs,
      limit,
      startAfter,
    } = await import('firebase/firestore');

    const plan = buildQueryPlan(filterState);
    const col = collection(db, 'submissions');

    // Build the server-side query constraints
    const constraints = plan.server.map((c) => {
      switch (c.op) {
        case '==':
          return where(c.field, '==', c.value);
        case 'in':
          return where(c.field, 'in', c.value);
        case 'array-contains':
          return where(c.field, 'array-contains', c.value);
      }
    });

    const orderConstraint = orderBy(plan.orderBy.field, plan.orderBy.direction);

    // Step 1: Get count (R10.4, R10.5)
    const countQuery = query(col, ...constraints);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count;

    // Step 2: If > 1000, show confirmation dialog (R10.5)
    if (totalCount > 1000) {
      const confirmed = await this.confirmLargeExport(totalCount);
      if (!confirmed) return;
    }

    // Step 3: Show "Exporting N..." snackbar (R10.4)
    const progressRef = this.snackBar.open(
      `Exporting ${totalCount} submissions...`,
      undefined,
      { duration: 0 }, // stays open until dismissed
    );

    try {
      // Step 4: Paged fetch — 500 documents per batch
      const allRecords: SubmissionRecord[] = [];
      let lastDoc: import('firebase/firestore').QueryDocumentSnapshot | null = null;
      let hasMore = true;

      while (hasMore) {
        const pageConstraints: import('firebase/firestore').QueryConstraint[] = lastDoc
          ? [...constraints, orderConstraint, startAfter(lastDoc), limit(500)]
          : [...constraints, orderConstraint, limit(500)];

        const pageQuery: import('firebase/firestore').Query = query(col, ...pageConstraints);
        const snapshot: import('firebase/firestore').QuerySnapshot = await getDocs(pageQuery);

        for (const doc of snapshot.docs) {
          const data = doc.data() as import('@submission-schema/submission').SubmissionDocument;
          const createdAtMs = toEpochMs(data.createdAt);
          const updatedAtMs = toEpochMs(data.updatedAt);
          allRecords.push({
            id: doc.id,
            document: data,
            createdAtMs,
            updatedAtMs,
          });
        }

        if (snapshot.docs.length < 500) {
          hasMore = false;
        } else {
          lastDoc = snapshot.docs.at(-1)!;
        }
      }

      // Step 5: Apply client predicates identically to the list page (R10.8)
      const filtered = applyClientPredicates(allRecords, plan.clientPredicates);

      // Step 6: Convert to ExportRow
      const rows: ExportRow[] = filtered.map(toExportRow);

      // Step 7: Serialize
      const content = format === 'csv' ? toCsv(rows) : toJson(rows);
      const mime = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8';
      const ext = format === 'csv' ? 'csv' : 'json';

      // Step 8: Download
      const filename = `submissions-${this.todayIso()}.${ext}`;
      this.download(content, filename, mime);

      // Dismiss progress and show success
      progressRef.dismiss();
      this.snackBar.open('Export complete', undefined, { duration: 3000 });
    } catch (err) {
      progressRef.dismiss();
      throw err; // re-throw so the outer catch shows "Export failed"
    }
  }

  /**
   * Opens the >1000 document confirmation dialog (R10.5).
   * Returns `true` if the user confirms, `false` if cancelled.
   */
  private confirmLargeExport(count: number): Promise<boolean> {
    return openAdminConfirm(this.dialog, `This will export ${count} submissions. Continue?`);
  }

  /**
   * Triggers a browser file download via Blob + object-URL + synthetic anchor.
   * Gated on `isBrowser()` — no-op off browser. Revokes the object URL
   * immediately after the click (R10.8).
   */
  private download(content: string, filename: string, mime: string): void {
    if (!this.isBrowserContext) return;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Returns today's date in YYYY-MM-DD format for the filename.
   */
  private todayIso(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a Firestore Timestamp or timestamp-like value to epoch milliseconds.
 * Handles both Firestore `Timestamp` objects (with `toMillis()`) and raw numbers.
 */
function toEpochMs(value: unknown): number {
  if (value !== null && typeof value === 'object' && 'toMillis' in value) {
    return (value as { toMillis(): number }).toMillis();
  }
  if (typeof value === 'number') return value;
  return 0;
}

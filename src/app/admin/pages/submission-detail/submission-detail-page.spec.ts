import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { SubmissionDetailPage } from './submission-detail-page';
import { FirebaseAppService } from '@core/firebase/firebase-app.service';
import { SubmissionMutationsService } from '../../data/submission-mutations.service';
import { ConfirmDialogComponent } from '@shared/ui/dialogs/confirm-dialog/confirm-dialog.component';

/**
 * Component Harness specs for SubmissionDetailPage (admin-dashboard R11, R12,
 * R13, portfolio-merge R14.16, R14.17). `FirebaseAppService` is mocked at the
 * boundary the page actually injects — its `onSnapshot` listener is driven
 * through a captured callback rather than a real Firestore connection,
 * mirroring `firestore-submission-sink.spec.ts`'s `vi.mock('firebase/firestore', ...)`
 * convention. Every async flow is awaited through `fixture.whenStable()` —
 * zero `fakeAsync`/`tick`.
 */
const { onSnapshotMock, docMock } = vi.hoisted(() => ({
  onSnapshotMock: vi.fn(),
  docMock: vi.fn((db: unknown, path: string, id: string) => ({ db, path, id })),
}));

vi.mock('firebase/firestore', () => ({
  doc: docMock,
  onSnapshot: onSnapshotMock,
}));

describe('SubmissionDetailPage', () => {
  let fixture: ComponentFixture<SubmissionDetailPage>;
  let firebaseMock: { getFirestore: ReturnType<typeof vi.fn> };
  let mutationsMock: { patch: ReturnType<typeof vi.fn> };
  let snapshotCallback: ((snapshot: unknown) => void) | undefined;
  let errorCallback: ((err: unknown) => void) | undefined;

  function pushSnapshot(data: Record<string, unknown> | null): void {
    if (data === null) {
      snapshotCallback?.({ exists: () => false });
      return;
    }
    snapshotCallback?.({
      exists: () => true,
      id: 'sub-1',
      data: () => data,
    });
  }

  async function createFixture(): Promise<void> {
    onSnapshotMock.mockReset();
    docMock.mockClear();
    onSnapshotMock.mockImplementation((_ref, onNext, onError) => {
      snapshotCallback = onNext;
      errorCallback = onError;
      return vi.fn(); // unsubscribe
    });

    firebaseMock = { getFirestore: vi.fn().mockResolvedValue({}) };
    mutationsMock = { patch: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [SubmissionDetailPage],
      providers: [
        provideRouter([]),
        { provide: FirebaseAppService, useValue: firebaseMock },
        { provide: SubmissionMutationsService, useValue: mutationsMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'sub-1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    // The constructor kicks off `startListener()` as a fire-and-forget async
    // chain (`getFirestore()` -> dynamic `import('firebase/firestore')` ->
    // `onSnapshot(...)`) that `whenStable()` does not track under zoneless
    // change detection, since it is not registered with Angular's pending-task
    // tracker. A real macrotask flush lets that chain settle before tests
    // invoke `pushSnapshot`/`errorCallback`.
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('renders the loading skeleton while the state is loading', async () => {
    await createFixture();

    expect(fixture.nativeElement.querySelector('.detail-skeleton')).not.toBeNull();
  });

  it('renders the missing state when the document does not exist', async () => {
    await createFixture();
    pushSnapshot(null);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.detail-missing')?.textContent).toContain(
      'Submission not found',
    );
  });

  it('renders the error state when the listener reports a terminal error', async () => {
    await createFixture();
    errorCallback?.({ code: 'permission-denied' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.detail-error')?.textContent).toContain(
      'Failed to load submission',
    );
  });

  it('renders the ready state with the document fields once the listener fires', async () => {
    await createFixture();
    pushSnapshot({
      type: 'contact',
      status: 'new',
      createdAt: { toMillis: () => 1_700_000_000_000 },
      updatedAt: { toMillis: () => 1_700_000_000_000 },
      read: true,
      payload: { name: 'Ada', email: 'ada@example.com' },
      notes: 'Some notes',
      tags: ['vip'],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.detail-content')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.type-chip')?.textContent).toContain('contact');
  });

  it('opens the shared ConfirmDialogComponent (not an admin-local dialog) when changing status to archived', async () => {
    await createFixture();
    pushSnapshot({
      type: 'contact',
      status: 'new',
      createdAt: { toMillis: () => 1_700_000_000_000 },
      updatedAt: { toMillis: () => 1_700_000_000_000 },
      read: true,
      payload: { name: 'Ada', email: 'ada@example.com' },
      notes: '',
      tags: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = TestBed.inject(MatDialog);
    const openSpy = vi
      .spyOn(dialog, 'open')
      .mockReturnValue({ afterClosed: () => of(true) } as unknown as ReturnType<MatDialog['open']>);

    await fixture.componentInstance['onStatusChange']('archived');
    await fixture.whenStable();

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toBe(ConfirmDialogComponent);
    expect(mutationsMock.patch).toHaveBeenCalledWith('sub-1', { status: 'archived' });
  });

  it('reverts the pending status and skips the patch when the confirmation is cancelled', async () => {
    await createFixture();
    pushSnapshot({
      type: 'contact',
      status: 'new',
      createdAt: { toMillis: () => 1_700_000_000_000 },
      updatedAt: { toMillis: () => 1_700_000_000_000 },
      read: true,
      payload: { name: 'Ada', email: 'ada@example.com' },
      notes: '',
      tags: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(false),
    } as unknown as ReturnType<MatDialog['open']>);

    await fixture.componentInstance['onStatusChange']('spam');
    await fixture.whenStable();

    expect(mutationsMock.patch).not.toHaveBeenCalled();
    expect(fixture.componentInstance['pendingStatus']()).toBe('new');
  });
});

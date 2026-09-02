import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ContactSubmissionService, type SubmitOutcome } from './contact-submission.service';
import { FirebaseAppService } from '@core/firebase/firebase-app.service';

const { addDocMock, collectionMock, serverTimestampMock } = vi.hoisted(() => ({
  addDocMock: vi.fn(),
  collectionMock: vi.fn((db: unknown, path: string) => ({ db, path })),
  serverTimestampMock: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
}));

vi.mock('firebase/firestore', () => ({
  addDoc: addDocMock,
  collection: collectionMock,
  serverTimestamp: serverTimestampMock,
}));

const CONTACT_PAYLOAD = {
  name: 'Ada',
  email: 'ada@example.com',
  projectType: 'turnkey',
  message: 'Hello',
};

describe('ContactSubmissionService', () => {
  let service: ContactSubmissionService;
  let firebaseAppMock: { getFirestore: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    addDocMock.mockReset();
    collectionMock.mockClear();
    serverTimestampMock.mockClear();

    firebaseAppMock = { getFirestore: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ContactSubmissionService,
        { provide: FirebaseAppService, useValue: firebaseAppMock },
      ],
    });

    service = TestBed.inject(ContactSubmissionService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves network-error when FirebaseAppService.getFirestore resolves null', async () => {
    firebaseAppMock.getFirestore.mockResolvedValue(null);

    const outcome = await firstValueFrom(service.submit(CONTACT_PAYLOAD));

    expect(outcome).toEqual({ kind: 'network-error' });
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it('routes an addDoc rejection through mapFirestoreErrorToOutcome', async () => {
    firebaseAppMock.getFirestore.mockResolvedValue({});
    addDocMock.mockRejectedValue({ code: 'permission-denied' });

    const outcome = await firstValueFrom(service.submit(CONTACT_PAYLOAD));

    expect(outcome).toEqual({ kind: 'http-error', status: 403 });
    expect(addDocMock).toHaveBeenCalledTimes(1);
  });

  it('resolves http-error 400 without ever calling addDoc when the payload does not classify', async () => {
    firebaseAppMock.getFirestore.mockResolvedValue({});

    const outcome = await firstValueFrom(service.submit({ unrelated: 'shape' }));

    expect(outcome).toEqual({ kind: 'http-error', status: 400 });
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it('resolves timeout when the overall pipeline exceeds 15,500 ms', async () => {
    vi.useFakeTimers();
    firebaseAppMock.getFirestore.mockReturnValue(
      new Promise(() => {
        // Never resolves — models getFirestore() hanging indefinitely
      }),
    );

    let outcome: SubmitOutcome | undefined;
    service.submit(CONTACT_PAYLOAD).subscribe((result) => {
      outcome = result;
    });

    await vi.advanceTimersByTimeAsync(15_501);

    expect(outcome).toEqual({ kind: 'timeout' });
    expect(addDocMock).not.toHaveBeenCalled();
  });
});

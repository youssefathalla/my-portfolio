import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { signal } from '@angular/core';

import { OverviewPage } from './overview-page';
import { OverviewCountsService, type CountState } from '../../data/overview-counts.service';

/**
 * Component Harness specs for OverviewPage (admin-dashboard R6, portfolio-merge
 * R14.16, R14.17). `OverviewCountsService`'s four `CountState` signals are
 * mocked directly — the page reads them through `getState`/`getValue`, so a
 * plain writable signal per card key reproduces every state transition
 * without touching Firestore.
 */
describe('OverviewPage', () => {
  let fixture: ComponentFixture<OverviewPage>;
  let total: ReturnType<typeof signal<CountState>>;
  let unread: ReturnType<typeof signal<CountState>>;
  let inProgress: ReturnType<typeof signal<CountState>>;
  let thisWeek: ReturnType<typeof signal<CountState>>;
  let refreshSpy: ReturnType<typeof vi.fn>;
  let initSpy: ReturnType<typeof vi.fn>;

  async function createFixture(): Promise<void> {
    total = signal<CountState>({ kind: 'loading' });
    unread = signal<CountState>({ kind: 'loading' });
    inProgress = signal<CountState>({ kind: 'loading' });
    thisWeek = signal<CountState>({ kind: 'loading' });
    refreshSpy = vi.fn();
    initSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [OverviewPage],
      providers: [
        {
          provide: OverviewCountsService,
          useValue: { total, unread, inProgress, thisWeek, refresh: refreshSpy, init: initSpy },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OverviewPage);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('renders the four cards with correct values in the ready state', async () => {
    await createFixture();
    total.set({ kind: 'ready', value: 12 });
    unread.set({ kind: 'ready', value: 3 });
    inProgress.set({ kind: 'ready', value: 5 });
    thisWeek.set({ kind: 'ready', value: 2 });
    fixture.detectChanges();
    await fixture.whenStable();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const values = Array.from(nativeElement.querySelectorAll('.card-value')).map((el) =>
      el.textContent?.trim(),
    );
    expect(values).toEqual(['12', '3', '5', '2']);
  });

  it('shows the empty-state message when the total count is ready and zero', async () => {
    await createFixture();
    total.set({ kind: 'ready', value: 0 });
    unread.set({ kind: 'ready', value: 0 });
    inProgress.set({ kind: 'ready', value: 0 });
    thisWeek.set({ kind: 'ready', value: 0 });
    fixture.detectChanges();
    await fixture.whenStable();

    const empty = fixture.nativeElement.querySelector('.empty-state');
    expect(empty?.textContent).toContain('No submissions yet');
  });

  it("retry button in the error state calls refresh with that card's key", async () => {
    await createFixture();
    total.set({ kind: 'error', code: 'unavailable' });
    unread.set({ kind: 'ready', value: 1 });
    inProgress.set({ kind: 'ready', value: 1 });
    thisWeek.set({ kind: 'ready', value: 1 });
    fixture.detectChanges();
    await fixture.whenStable();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const retryButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '.card-retry-btn' }),
    );
    await retryButton.click();
    await fixture.whenStable();

    expect(refreshSpy).toHaveBeenCalledWith('total');
  });

  it('calls init on OverviewCountsService when initialized', async () => {
    await createFixture();
    expect(initSpy).toHaveBeenCalledTimes(1);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';

import { LoginPage } from './login-page';
import { AuthService } from '../../auth/auth.service';
import type { AuthState } from '../../auth/auth-state';

/**
 * Component Harness specs for LoginPage (admin-dashboard R4, portfolio-merge
 * R14.16, R14.17). `AuthService` is mocked at the service boundary — the
 * page injects it directly, never touching `firebase/auth` — and every
 * async flow is awaited through `fixture.whenStable()`. Zero `fakeAsync`/`tick`.
 */
describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let authServiceMock: {
    authState: ReturnType<typeof vi.fn>;
    warmUp: ReturnType<typeof vi.fn>;
    signInWithGoogle: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
  let navigateByUrlSpy: ReturnType<typeof vi.fn>;

  function configureModule(): void {
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    });
  }

  async function createFixture(): Promise<void> {
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(() => {
    authServiceMock = {
      authState: vi.fn(() => ({ kind: 'unauthenticated' }) as AuthState),
      warmUp: vi.fn().mockResolvedValue(undefined),
      signInWithGoogle: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('renders the Google sign-in button', async () => {
    configureModule();
    await createFixture();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const button = await loader.getHarness(MatButtonHarness.with({ text: /Sign in with Google/ }));

    expect(await button.getText()).toContain('Sign in with Google');
    expect(authServiceMock.warmUp).toHaveBeenCalledTimes(1);
  });

  it('clicking the sign-in button calls signInWithGoogle and navigates on success', async () => {
    configureModule();
    const router = TestBed.inject(Router);
    navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await createFixture();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const button = await loader.getHarness(MatButtonHarness.with({ text: /Sign in with Google/ }));
    await button.click();
    await fixture.whenStable();

    expect(authServiceMock.signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/admin');
  });

  it('renders an error message and re-enables the button when sign-in rejects', async () => {
    authServiceMock.signInWithGoogle.mockRejectedValue({ code: 'auth/user-disabled' });
    configureModule();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await createFixture();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const button = await loader.getHarness(MatButtonHarness.with({ text: /Sign in with Google/ }));
    await button.click();
    await fixture.whenStable();

    expect(await button.isDisabled()).toBe(false);
    const errorEl = (fixture.nativeElement as HTMLElement).querySelector('.login-error');
    expect(errorEl?.textContent).toContain('Account disabled');
  });

  it('shows no error message when the popup is dismissed (unknown code)', async () => {
    authServiceMock.signInWithGoogle.mockRejectedValue(new Error('popup closed'));
    configureModule();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await createFixture();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const button = await loader.getHarness(MatButtonHarness.with({ text: /Sign in with Google/ }));
    await button.click();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.login-error')).toBeNull();
  });
});

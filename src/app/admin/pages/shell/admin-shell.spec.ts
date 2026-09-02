import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';

import { AdminShell } from './admin-shell';
import { AuthService } from '../../auth/auth.service';
import type { AuthState } from '../../auth/auth-state';

/**
 * Component Harness specs for AdminShell (admin-dashboard R5, portfolio-merge
 * R14.16, R14.17). `AuthService` is mocked so the shell's authenticated-email
 * derivation and logout flow are exercised without touching `firebase/auth`.
 */
describe('AdminShell', () => {
  let fixture: ComponentFixture<AdminShell>;
  let authServiceMock: {
    authState: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };

  function configureModule(): void {
    TestBed.configureTestingModule({
      imports: [AdminShell],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    });
  }

  async function createFixture(): Promise<void> {
    fixture = TestBed.createComponent(AdminShell);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(() => {
    authServiceMock = {
      authState: vi.fn(
        () => ({ kind: 'authenticated', uid: 'u1', email: 'admin@example.com' }) as AuthState,
      ),
      signOut: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('renders one nav link per admin content entry', async () => {
    configureModule();
    await createFixture();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const links = nativeElement.querySelectorAll('a.nav-link');
    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('Overview');
    expect(links[1].textContent).toContain('Submissions');
  });

  it("renders the authenticated user's email in the header", async () => {
    configureModule();
    await createFixture();

    const emailEl = (fixture.nativeElement as HTMLElement).querySelector('.header-email');
    expect(emailEl?.textContent).toContain('admin@example.com');
  });

  it('logout button calls signOut then navigates to /admin/login', async () => {
    configureModule();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await createFixture();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const logoutButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Log out"]' }));
    await logoutButton.click();
    await fixture.whenStable();

    expect(authServiceMock.signOut).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/login']);
  });
});

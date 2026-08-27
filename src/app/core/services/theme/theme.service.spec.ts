import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { ThemeService } from './theme.service';

// afterNextRender only fires within a real render cycle, so the service is
// injected through a trivial host component rather than TestBed.inject directly.
@Component({ selector: 'app-theme-host', template: '' })
class ThemeHostComponent {
  readonly theme = new ThemeService();
}

describe('ThemeService', () => {
  let fixture: ComponentFixture<ThemeHostComponent>;
  let matchMediaSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    matchMediaSpy = vi.fn().mockReturnValue({ matches: false });
    vi.stubGlobal('matchMedia', matchMediaSpy);

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  async function createHost(): Promise<ThemeHostComponent> {
    fixture = TestBed.createComponent(ThemeHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.componentInstance;
  }

  it('should create', async () => {
    const host = await createHost();
    expect(host.theme).toBeTruthy();
  });

  it('defaults to light mode when there is no saved preference and the system prefers light', async () => {
    matchMediaSpy.mockReturnValue({ matches: false });
    const host = await createHost();

    expect(host.theme.isDarkMode()).toBe(false);
  });

  it('falls back to the system preference (dark) when there is no saved preference', async () => {
    matchMediaSpy.mockReturnValue({ matches: true });
    const host = await createHost();

    expect(host.theme.isDarkMode()).toBe(true);
  });

  it('prioritizes a saved preference over the system preference', async () => {
    localStorage.setItem('user-theme', 'dark');
    matchMediaSpy.mockReturnValue({ matches: false });
    const host = await createHost();

    expect(host.theme.isDarkMode()).toBe(true);
  });

  it('toggleTheme flips isDarkMode and persists the new value to localStorage', async () => {
    matchMediaSpy.mockReturnValue({ matches: false });
    const host = await createHost();

    expect(host.theme.isDarkMode()).toBe(false);

    host.theme.toggleTheme();

    expect(host.theme.isDarkMode()).toBe(true);
    expect(localStorage.getItem('user-theme')).toBe('dark');

    host.theme.toggleTheme();

    expect(host.theme.isDarkMode()).toBe(false);
    expect(localStorage.getItem('user-theme')).toBe('light');
  });

  it('applies the dark class and color-scheme style to the document element when enabled', async () => {
    localStorage.setItem('user-theme', 'dark');
    const host = await createHost();
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');

    host.theme.toggleTheme();
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});

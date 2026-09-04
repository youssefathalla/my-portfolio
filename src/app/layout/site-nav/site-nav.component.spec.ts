import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { LOCALE } from '@core/i18n/locale';
import { SiteNavComponent } from './site-nav.component';

describe('SiteNavComponent', () => {
  let component: SiteNavComponent;
  let fixture: ComponentFixture<SiteNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteNavComponent],
      providers: [
        provideRouter([], withComponentInputBinding()),
        { provide: LOCALE, useValue: 'en' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteNavComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render Youssef, the logo emblem, and Fathalla', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Youssef');
    expect(el.textContent).toContain('Fathalla');
    const img: HTMLImageElement | null = el.querySelector('img[src="/brand/favicon.png"]');
    expect(img).toBeTruthy();
  });

  it('should update scrolled state on window scroll event', async () => {
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();

    const innerDiv: HTMLElement | null = fixture.nativeElement.querySelector('header > div.mx-auto');
    expect(innerDiv?.classList.contains('rounded-full')).toBe(true);

    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();

    expect(innerDiv?.classList.contains('rounded-none')).toBe(true);
  });

  it('should toggle theme when theme button is clicked', async () => {
    const themeBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector('button[aria-label*="mode"]');
    expect(themeBtn).toBeTruthy();

    const labelBefore = themeBtn?.getAttribute('aria-label');
    themeBtn?.click();
    await fixture.whenStable();

    const labelAfter = themeBtn?.getAttribute('aria-label');
    expect(labelAfter).not.toBe(labelBefore);
  });
});

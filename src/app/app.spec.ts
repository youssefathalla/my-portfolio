import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideNativeDateAdapter()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the routed playground page at the root path', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).toContain('Design System & Component Playground');
  });
});

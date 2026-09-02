import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { environment } from '@env/environment';
import { AnalyticsAdapter, NoopAnalyticsAdapter } from './core/analytics/analytics';
import { RealAnalyticsAdapter } from './core/analytics/real-analytics-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Binds route params, query params, static route data and resolver output
    // straight to component input() signals. See AGENTS.md -> Routing.
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideNativeDateAdapter(),
    provideHttpClient(),
    // Use the self-hosted Material Symbols Outlined font (see src/styles/_fonts.scss)
    // instead of the default 'material-icons' class, which requires the Google Fonts CDN.
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
    {
      provide: AnalyticsAdapter,
      useClass: environment.analyticsEnabled ? RealAnalyticsAdapter : NoopAnalyticsAdapter,
    },
  ],
};

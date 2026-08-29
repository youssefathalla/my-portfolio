import './test-setup';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideTransloco } from '@jsverse/transloco';
import { translocoConfig } from '@core/i18n/transloco.config';

const testProviders: (Provider | EnvironmentProviders)[] = [
  // Mirror app.config.ts so routed-component tests see the same input binding behaviour.
  provideRouter([], withComponentInputBinding()),
  provideHttpClient(),
  provideHttpClientTesting(),
  provideNativeDateAdapter(),
  provideTransloco(translocoConfig),
  { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
];
export default testProviders;

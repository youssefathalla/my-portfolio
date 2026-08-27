import './test-setup';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideTransloco } from '@jsverse/transloco';
import { translocoConfig } from '@core/i18n/transloco.config';

const testProviders: (Provider | EnvironmentProviders)[] = [
  provideRouter([]),
  provideHttpClient(),
  provideHttpClientTesting(),
  provideNativeDateAdapter(),
  provideTransloco(translocoConfig),
];
export default testProviders;

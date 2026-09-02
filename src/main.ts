import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Required before bootstrap: LOCALE_ID: 'ar' (see app.routes.ts's 'ar'
// Locale_Route_Group) throws NG02100 on the first DatePipe evaluation
// without this registration.
registerLocaleData(localeAr, 'ar');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

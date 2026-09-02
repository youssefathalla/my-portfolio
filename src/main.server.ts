import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { config } from './app/app.config.server';

// Required before bootstrap: LOCALE_ID: 'ar' (see app.routes.ts's 'ar'
// Locale_Route_Group) throws NG02100 on the first DatePipe evaluation
// without this registration. Needed here too since prerendering the
// 'ar' Locale_Route_Group's manifest routes runs through main.server.ts.
registerLocaleData(localeAr, 'ar');

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;

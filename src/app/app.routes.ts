import { LOCALE_ID } from '@angular/core';
import { Routes } from '@angular/router';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { LOCALE } from './core/i18n/locale';
import { LangService } from './core/i18n/services/lang.service';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { PublicShellComponent } from '@layout/public-shell/public-shell.component';
import { publicRoutes } from './public.routes';

export const routes: Routes = [
  // 🇸🇦 Arabic Route Group (/ar/...)
  {
    path: 'ar',
    providers: [
      { provide: LOCALE, useValue: 'ar' },
      { provide: LOCALE_ID, useValue: 'ar' },
      { provide: MAT_DATE_LOCALE, useValue: 'ar-u-nu-latn' },
      LangService,
    ],
    component: PublicShellComponent,
    children: [
      ...publicRoutes,
      { path: '**', component: NotFoundComponent },
    ],
  },
  // Admin module (outside locale prefix)
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  // 🇬🇧 English Default Route Group (/...)
  {
    path: '',
    providers: [
      { provide: LOCALE, useValue: 'en' },
      { provide: LOCALE_ID, useValue: 'en' },
      { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
      LangService,
    ],
    component: PublicShellComponent,
    children: [
      ...publicRoutes,
      { path: '**', component: NotFoundComponent },
    ],
  },
  // Top-level catch-all 404
  { path: '**', component: NotFoundComponent },
];

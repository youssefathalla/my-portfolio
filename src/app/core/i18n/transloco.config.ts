import { isDevMode } from '@angular/core';
import { TranslocoHttpLoader } from '@core/i18n/services/transloco-loader.service';
export type SupportedLanguage = 'en' | 'ar' | 'hi';
export const translocoConfig = {
  config: {
    availableLangs: ['en', 'ar', 'hi'],
    defaultLang: 'en',
    reRenderOnLangChange: true,
    prodMode: !isDevMode(),
  },
  loader: TranslocoHttpLoader,
};

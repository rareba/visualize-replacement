import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { ObMasterLayoutModule, ObIconModule, WINDOW, provideObliqueConfiguration } from '@oblique/oblique';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    { provide: WINDOW, useValue: window },
    provideObliqueConfiguration({
      accessibilityStatement: {
        applicationName: 'LINDAS Visualizer',
        applicationOperator: 'Swiss Federal Administration',
        createdOn: new Date('2025-01-22'),
        conformity: 'full',
        contact: [{
          email: 'lindas@admin.ch'
        }]
      },
      hasLanguageInUrl: false
    }),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    }),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateHttpLoader
        },
        defaultLanguage: 'en'
      }),
      ObIconModule,
      ObMasterLayoutModule
    )
  ]
};

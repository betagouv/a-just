import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core'
import { provideRouter } from '@angular/router'

import { routes } from './routes/app.routes'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { authInterceptor } from './interceptors'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { provideNativeDateAdapter } from '@angular/material/core'
import localeFr from '@angular/common/locales/fr'
import { registerLocaleData } from '@angular/common'
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip'
registerLocaleData(localeFr, 'fr')

/**
 * Default tooltip options
 */
export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 1000,
  touchendHideDelay: 1000,
}

/**
 * App config global de l'application
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults },
  ],
}

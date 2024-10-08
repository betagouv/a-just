// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
// @ts-ignore
import packageJSON from '../../../package.json'

/**
 * Variables global avec url serveur différent ou matomo qui change
 */
export const environment = {
  production: false,
  serverUrl: 'http://localhost:8081/api/',
  nbDaysByMagistrat: 208,
  nbDaysByFonctionnaire: 229.57, // 1607 heures / an
  nbHoursPerDayAndFonctionnaire: 7,
  nbHoursPerDayAndMagistrat: 8,
  version: packageJSON.version,
  matomo: null,
  matomoTM: null,
  forceSSL: false,
  supportEmail: 'support-utilisateurs@a-just.fr',
  mapboxToken:
    'pk.eyJ1IjoiZnhiZXRhIiwiYSI6ImNsZzZldHhvMTAzanEzc3BrYXJ5dXA1czYifQ.FlyDfsXjidTxi7XE50a07w',
  mapboxStyle: 'mapbox://styles/fxbeta/clm7xuvg4012d01pb1jc6887h',
  gitbookToken: 'gb_api_rHt5wBv5WBzk2mjUuO2QymdKNpNujdBD8TLfYpsA',
  gitbookId: 'S99g6aJCtkSrC9hKXFqV',
  enableSSO: true,
  //typeId: process.env['TYPE_ID'] || 0,
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

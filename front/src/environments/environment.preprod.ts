// @ts-ignore
import packageJSON from '../../../package.json';

/**
 * Variables global avec url serveur différent ou matomo qui change
 */
export const environment = {
  production: true,
  serverUrl: '/api/',
  nbDaysByMagistrat: 208,
  nbDaysByFonctionnaire: 229.57, // 1607 heures / an
  nbHoursPerDayAndFonctionnaire: 7,
  nbHoursPerDayAndMagistrat: 8,
  version: packageJSON.version,
  matomo: null,
  matomoTM: null,
  forceSSL: true,
  supportEmail: 'support-utilisateurs@a-just.fr',
  mapboxToken:
    'pk.eyJ1IjoiZnhiZXRhIiwiYSI6ImNsZzZldWR4dDA0aDEzZHBjazUxeWR5ZXYifQ.EHCQXWZ-t7RHL8EpCRXIng',
  mapboxStyle: 'mapbox://styles/fxbeta/clg6ed492002m01lafhmrc98n',
  gitbookId: 'S99g6aJCtkSrC9hKXFqV',
  enableSSO: false,
  crisp: 'f0a0070f-d442-40f5-b614-499d668f4593',
  //typeId: process.env['TYPE_ID'] || 0,
};

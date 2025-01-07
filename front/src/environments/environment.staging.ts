// @ts-ignore
import packageJSON from '../../../package.json';

/**
 * Variables global avec url serveur différent ou matomo qui change
 */
export const environment = {
  production: true,
  frontUrl: 'https://a-just.incubateur.net',
  serverUrl: '/api/',
  nbDaysByMagistrat: 208,
  nbDaysByFonctionnaire: 229.57, // 1607 heures / an
  nbHoursPerDayAndFonctionnaire: 7,
  nbHoursPerDayAndMagistrat: 8,
  version: packageJSON.version,
  matomo: 64,
  matomoTM: 'ypx7B8mu',
  forceSSL: true,
  supportEmail: 'support-utilisateurs@a-just.fr',
  mapboxToken:
    'pk.eyJ1IjoiZnhiZXRhIiwiYSI6ImNsZzZldHhvMTAzanEzc3BrYXJ5dXA1czYifQ.FlyDfsXjidTxi7XE50a07w',
  mapboxStyle: 'mapbox://styles/fxbeta/clm7xuvg4012d01pb1jc6887h',
  gitbookId: 'S99g6aJCtkSrC9hKXFqV',
  enableSSO: true,
  crisp: 'f0a0070f-d442-40f5-b614-499d668f4593',
  //typeId: process.env['TYPE_ID'] || 0,
};

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
  forceSSL: true,
  supportEmail: 'support-utilisateurs@a-just.fr',
  mapboxToken: 'pk.eyJ1IjoiZnhiZXRhIiwiYSI6ImNsZzZldHhvMTAzanEzc3BrYXJ5dXA1czYifQ.FlyDfsXjidTxi7XE50a07w'
};

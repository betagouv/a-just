// @ts-ignore
import packageJSON from '../../../package.json';

export const environment = {
  production: true,
  serverUrl: '/api/', 
  nbDaysByMagistrat: 208,
  nbHoursPerDayAndMagistrat: 8,
  version: packageJSON.version,
  matomo: 262,
  forceSSL: true,
};

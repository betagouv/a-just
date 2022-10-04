// @ts-ignore
import packageJSON from '../../../package.json';

export const environment = {
  production: true,
  serverUrl: '/api/', 
  nbDaysByMagistrat: 208,
  nbHoursPerDay: 8,
  version: packageJSON.version,
  matomo: 262,
};

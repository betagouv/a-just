import {
  HAS_ACCESS_TO_CONTRACTUEL,
  HAS_ACCESS_TO_GREFFIER,
  HAS_ACCESS_TO_MAGISTRAT,
  USER_ACCESS_ACTIVITIES,
  USER_ACCESS_SIMULATOR,
  USER_ACCESS_VENTILATIONS,
  USER_ACCESS_WHITE_SIMULATOR,
} from '../constants/user-access';
import { UserInterface } from '../interfaces/user-interface';

/**
 * Can view magistrat interface
 * @param user
 */
export const userCanViewMagistrat = (user: UserInterface | null) => {
  const acces = user && user.access ? user.access : [];

  return acces.indexOf(HAS_ACCESS_TO_MAGISTRAT) !== -1;
};

/**
 * Can view greffier interface
 * @param user
 */
export const userCanViewGreffier = (user: UserInterface | null) => {
  const acces = user && user.access ? user.access : [];

  return acces.indexOf(HAS_ACCESS_TO_GREFFIER) !== -1;
};

/**
 * Can view contractuel interface
 * @param user
 */
export const userCanViewContractuel = (user: UserInterface | null) => {
  const acces = user && user.access ? user.access : [];

  return acces.indexOf(HAS_ACCESS_TO_CONTRACTUEL) !== -1;
};

/**
 * Can view activities interface
 * @param user
 */
export const userCanViewActivities = (user: UserInterface | null) => {
  const acces = user && user.access ? user.access : [];

  return acces.indexOf(USER_ACCESS_ACTIVITIES) !== -1;
};

/**
 * Can view ventilateur interface
 * @param user
 */
export const userCanViewVentilateur = (user: UserInterface | null) => {
  const acces = user && user.access ? user.access : [];

  return acces.indexOf(USER_ACCESS_VENTILATIONS) !== -1;
};

/**
 * Can view white simulator
 * @param user
 */
export const userCanViewWhiteSimulator = (user: UserInterface | null) => {
  const acces = user && user.access ? user.access : [];

  return acces.indexOf(USER_ACCESS_WHITE_SIMULATOR) !== -1;
};

/**
 * Can view white simulator
 * @param user
 */
export const userCanViewSimulator = (user: UserInterface | null) => {
  const acces = user && user.access ? user.access : [];

  return acces.indexOf(USER_ACCESS_SIMULATOR) !== -1;
};

export const MIN_PASSWORD_LENGTH = 8;

import { HAS_ACCESS_TO_CONTRACTUEL, HAS_ACCESS_TO_GREFFIER, HAS_ACCESS_TO_MAGISTRAT } from "../constants/user-access";
import { UserInterface } from "../interfaces/user-interface";

/**
 * Can view magistrat interface
 * @param user 
 */
export const userCanViewMagistrat = (user: UserInterface | null) => {
  const acces = user && user.access ? user.access : []

  return acces.indexOf(HAS_ACCESS_TO_MAGISTRAT) !== -1
}

/**
 * Can view greffier interface
 * @param user 
 */
export const userCanViewGreffier = (user: UserInterface | null) => {
  const acces = user && user.access ? user.access : []

  return acces.indexOf(HAS_ACCESS_TO_GREFFIER) !== -1
}

/**
 * Can view contractuel interface
 * @param user 
 */
export const userCanViewContractuel = (user: UserInterface | null) => {
  const acces = user && user.access ? user.access : []

  return acces.indexOf(HAS_ACCESS_TO_CONTRACTUEL) !== -1
}
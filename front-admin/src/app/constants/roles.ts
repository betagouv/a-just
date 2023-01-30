/**
 * Id de role de type ADMINISTRATEUR
 */
export const USER_ROLE_ADMIN = 1;
export const USER_ROLE_SUPER_ADMIN = 2;
export const roleToString = (roleId: number | null) => {
  switch (roleId) {
    case USER_ROLE_ADMIN:
      return "Administrateur";
    case USER_ROLE_SUPER_ADMIN:
      return "Super Administrateur";
  }

  return "Client";
};

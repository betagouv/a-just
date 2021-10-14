export const USER_ROLE_ADMIN = 1
export const roleToString = (roleId) => {
  switch(roleId) {
  case USER_ROLE_ADMIN:
    return 'Administrateur'
  }

  return 'Client'
}
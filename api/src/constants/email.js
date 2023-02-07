import config from 'config'

/**
 * Id des templates pour sendinblue
 */

export const TEMPLATE_FORGOT_PASSWORD_ID = 1
export const TEMPLATE_NEW_USER_SIGNIN = 5
export const TEMPLATE_USER_ONBOARDING = 3
export const TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED = 8
export const TEMPLATE_CRON_USERS_NOT_CONNECTED = 17

export const SENDING_BLUE_USER_LIST_ID = config.sendingBlue.usersListId

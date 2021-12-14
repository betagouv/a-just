import { Types as ksTypes } from 'koa-smart'

// eslint-disable-next-line
const REGEX_EMAIL = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


const general = {
  boolean: (defaultValue = false) =>
    ksTypes
      .boolean()
      .truthy(['1', 1])
      .falsy(['0', 0])
      .default(defaultValue),
}

const User = {
  email: () =>
    ksTypes
      .string()
      .lowercase()
      .regex(REGEX_EMAIL)
      .setErrorMsg('does not match format'),

  password: () =>
    ksTypes
      .string()
      .trim()
      .min(1)
      .max(32),
}

export const Types = ksTypes

export default {
  ...general,
  User,
}

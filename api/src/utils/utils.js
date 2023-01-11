export function ucFirst (str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function round (number) {
  if (!number) {
    return 0
  }
  return Math.round(+number * 100) / 100
}

/**
 * Take a csv string and return a json object
 *
 * @param {string} csv csv string
 * @param {(','|';')} [separator=','] data separator in csv string
 * @return {(Object)} Return a json object or an empty object if something goes wrong (bad csv format or wrong separator)
 */
export function csvToJson (csv, separator = ',') {
  let toArray = csv
    .trim()
    .replace(/"/g, '')
    .split('\n')
    .map((el) => el.split(separator))

  const titles = toArray.shift()

  if (!titles || !toArray[0] || titles.length !== toArray[0].length || toArray.filter((el) => el.length !== toArray[0].length)[0] !== undefined) return []

  const toJSON = toArray.map((el) => {
    let object = {}
    for (const index in el) object[titles[index]] = el[index]
    return object
  })

  return toJSON
}

export function sleep (duration = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

export function controlPassword (password) {
  if (password.length < 6) {
    return false
  }

  return true
}

export function validateEmail (email) {
  // eslint-disable-next-line max-len
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

/**
 * Converti une string aa-dd en aaDd
 * @param {*} str
 * @returns
 */
export const snakeToCamel = (str) => str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''))
/**
 * Converti un object { aa-dd: xx } en { aaDd: xx }
 * @param {*} object
 * @returns
 */
export const snakeToCamelObject = (object) => {
  if (!object) {
    return null
  }

  const objectReturn = {}
  for (const [key, value] of Object.entries(object)) {
    objectReturn[snakeToCamel(key)] = value
  }

  return objectReturn
}

/**
 * Converti un tableau d'objets [ { aa-dd: xx } ] en [ { aaDd: xx } ]
 * @param {*} list
 * @returns
 */
export const snakeToCamelArray = (list) => {
  for (var i = 0; i < list.length; i++) {
    list[i] = snakeToCamelObject(list[i])
  }

  return list
}

/**
 * Converti une string de camel to Snake aaDd en aa_dd
 * @param {*} str
 * @returns
 */
export const camel_to_snake = (str) => str[0].toLowerCase() + str.slice(1, str.length).replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

/**
 * Converti un objet de camel to Snake { aaDd : xx } en { aa_dd : xx }
 * @param {*} str
 * @returns
 */
export const camel_to_snake_object = (object) => {
  const objectReturn = {}
  for (const [key, value] of Object.entries(object)) {
    objectReturn[camel_to_snake(key)] = value
  }

  return objectReturn
}

export const dayOfDate = (date) => {
  const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
  return newDate
}

export const dayOfMonth = (date) => {
  const newDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0)
  return newDate
}

/**
 * @desc transforms an Object into an array of key-value pairs
 * @todo check if this is right => currently returns array of values and use interface KeyValue
 */
export function objValToArray (obj) {
  return Object.keys(obj).map((k) => obj[k])
}

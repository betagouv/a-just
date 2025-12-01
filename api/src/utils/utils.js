export function ucFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function round(number) {
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
export function csvToJson(csv, separator = ',') {
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

export function sleep(duration = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

export function controlPassword(password) {
  if (password.length < 6) {
    return false
  }

  return true
}

export function validateEmail(email) {
  // eslint-disable-next-line max-len
  const re = /^((?!\.)[\w_.]*[^.])(@[\w-]+)(\.\w+(\.\w+)?[^.\W])$/gim
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
export function objValToArray(obj) {
  return Object.keys(obj).map((k) => obj[k])
}

import fs from 'fs'
import deepEqual from 'fast-deep-equal' // Ou ta fonction deepEqual existante

/**
 * Compare deux listes d'objets et retourne uniquement les éléments différents.
 *
 * @param {Array<object>} oldResult - Ancien tableau d'objets (comparé par index, comme ta version)
 * @param {Array<object>} newResult - Nouveau tableau d'objets (comparé par index)
 * @param {object} [opts]
 * @param {boolean} [opts.detailed=false] - Si true, inclut old/new complets en plus des changements.
 * @param {string}  [opts.exportPath='./computeExtract-differences.json'] - Chemin du JSON à écrire si différences.
 * @param {boolean} [opts.writeFile=true] - Ecrit le fichier JSON quand des différences existent.
 * @param {boolean} [opts.throwOnDiff=true] - Lève une erreur si des différences existent.
 * @param {string[]} [opts.ignoreKeys=[]] - Clés à ignorer dans la comparaison (ex: dates de génération, etc.).
 * @returns {{ allEqual: boolean, differences: Array<object> }}
 */
export const compareResults = (
  oldResult,
  newResult,
  { detailed = false, exportPath = './computeExtract-differences.json', writeFile = true, throwOnDiff = true, ignoreKeys = [] } = {},
) => {
  let allEqual = true
  const differences = []

  // Log longueur (on garde le check de ta version)
  if (oldResult.length !== newResult.length) {
    console.error(`❌ Nombre d'éléments différents : ${oldResult.length} vs ${newResult.length}`)
    allEqual = false
  }

  const len = Math.min(oldResult.length, newResult.length)

  for (let i = 0; i < len; i++) {
    const oldItem = oldResult[i]
    const newItem = newResult[i]

    if (!shallowDeepEqualFiltered(oldItem, newItem, ignoreKeys)) {
      allEqual = false
      const changes = diffObject(oldItem, newItem, ignoreKeys)

      // On ne retourne que les éléments "posant problème"
      differences.push(
        detailed
          ? {
              index: i,
              id: oldItem?.['Réf.'] ?? newItem?.['Réf.'],
              changes, // { clé: [old, new] }
              old: oldItem,
              new: newItem,
            }
          : {
              index: i,
              id: oldItem?.['Réf.'] ?? newItem?.['Réf.'],
              changes, // minimal et actionnable
            },
      )
    }
  }

  if (!allEqual) {
    console.error(`❌ ${differences.length} différence(s) trouvée(s).`)
    if (writeFile) {
      fs.writeFileSync(exportPath, JSON.stringify(differences, null, 2), 'utf-8')
      console.error(`📝 Différences enregistrées dans ${exportPath}`)
    }
    if (throwOnDiff) {
      throw new Error('Non-régression échouée.')
    }
  } else {
    console.log('✅ Test de non-régression réussi. Les deux versions donnent des résultats identiques.')
  }

  return { allEqual, differences }
}

/** Retourne un objet { cle: [oldVal, newVal], ... } pour les seules clés différentes. */
function diffObject(a = {}, b = {}, ignoreKeys = []) {
  const changes = {}
  const skip = new Set(ignoreKeys)
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})])

  for (const k of keys) {
    if (skip.has(k)) continue
    const av = a?.[k]
    const bv = b?.[k]

    const bothNaN = Number.isNaN(av) && Number.isNaN(bv)
    const sameType = typeof av === typeof bv

    if (!bothNaN && (av !== bv || !sameType)) {
      changes[k] = [av, bv]
    }
  }
  return changes
}

/**
 * Égalité "deep" simplifiée mais filtrée par clés ignorées.
 * Ici on fait une comparaison clé à clé (profil tableau d'objets plats),
 * stricte sur valeur et type, en ignorant ignoreKeys.
 */
function shallowDeepEqualFiltered(a = {}, b = {}, ignoreKeys = []) {
  const skip = new Set(ignoreKeys)
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})])

  for (const k of keys) {
    if (skip.has(k)) continue
    const av = a?.[k]
    const bv = b?.[k]
    const bothNaN = Number.isNaN(av) && Number.isNaN(bv)
    if (!bothNaN && (av !== bv || typeof av !== typeof bv)) {
      return false
    }
  }
  return true
}

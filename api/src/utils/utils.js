import moment from 'moment'
import _, { sumBy } from 'lodash'
import Jimp from 'jimp'
import { fixDecimal } from './number'
import { getBoundsOfDistance } from 'geolib'


export function arrayToObjectByKey (data, key, keepRef = true) {
  const object = data.reduce((acc, cur) => {
    if (keepRef) {
      acc[cur[key]] = cur
    } else {
      acc[cur[key]] = { ...cur }
    }
    return acc
  }, {})
  return object
}

export function arrayToObjectByKeys (data, keys, separator = '-', keepRef = true) {
  const object = data.reduce((acc, cur) => {
    let key = ''
    for (const k in keys) {
      key += `${cur[keys[k]] || ''}`
      if (k < keys.length - 1) {
        key += `${separator}`
      }
    }
    if (keepRef) {
      acc[key] = cur
    } else {
      acc[key] = { ...cur }
    }
    return acc
  }, {})
  return object
}

export function ucFirst (str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function cleanUrl (url) {
  return url.replace(/\/+/g, '/')
}

export function dateFormatYYYYMMDD (date = null, offset = 0, offsetType = 'days') {
  date = moment(date ? date : undefined)
  date.add(offset, offsetType)
  return date.format('YYYY-MM-DD')
}

export function dateFormatYYYYMMDDHH (date = null, offset = 0, offsetType = 'hours') {
  date = moment(date ? date : undefined)
  date.add(offset, offsetType)
  return date.format('YYYY-MM-DD HH:00:00')
}

export function dateFormatTimestamp (date = null) {
  return Math.floor(moment(date ? date : undefined).format('X'))
}

export function dateFormatTimestampDay (date = null) {
  return Math.floor(moment(date ? date : undefined).format('X') / 60 / 60 / 24)
}

export function dateFormatTimestampHour (date = null) {
  return Math.floor(moment(date ? date : undefined).format('X') / 60 / 60)
}

export function dateFormatTimestampDayToYYYYMMDD (timestampDay = 0) {
  return moment(0)
    .add(timestampDay, 'days')
    .format('YYYY-MM-DD')
}

export function dateFormatTimestampHourToYYYYMMDDHH (timestampHour = 0) {
  return moment(0)
    .add(timestampHour, 'hours')
    .format('YYYY-MM-DD HH:00:00')
}

export function dateDiff (startDate = null, endDate = null, offsetType = 'days') {
  startDate = moment(startDate ? startDate : undefined)
  endDate = moment(endDate ? endDate : undefined)
  return endDate.diff(startDate, offsetType)
}

export function timeDiff (startDate = null, endDate = null) {
  startDate = startDate ? new Date(startDate) : new Date()
  endDate = endDate ? new Date(endDate) : new Date()
  return endDate.getTime() - startDate.getTime()
}

export function round (number) {
  if (!number) {
    return 0
  }
  return Math.round(+number * 100) / 100
}

export function randomWithPercentage (data) {
  let percent = 0
  const elements = []
  for (const d of data) {
    elements.push({ data: d, percent })
    percent += parseFloat(d.percent)
  }
  const rand = Math.random() * 100
  let elem = null
  for (const e of elements) {
    if (rand > e.percent) {
      elem = e.data
    }
  }
  return elem
}

/**
 * Take a csv string and return a json object
 *
 * @param {string} csv csv string
 * @param {(','|';')} [separator=','] data separator in csv string
 * @return {(Object)} Return a json object or an empty object if something goes wrong (bad csv format or wrong separator)
 */
export function csvToJson (csv, separator = ',') {
  let toArray = csv.trim().replace(/"/g, '').split('\n').map(el => el.split(separator))

  const titles = toArray.shift()

  if (
    !titles
    || !toArray[0]
    || titles.length !== toArray[0].length
    || toArray.filter(el => el.length !== toArray[0].length)[0] !== undefined
  ) return []

  const toJSON = toArray.map(el => {
    let object = {}
    for (const index in el) object[titles[index]] = el[index]
    return object
  })

  return toJSON
}

export function arrayIsEqual (arr1, arr2) {
  _.isEqual(_.sortBy(arr1), _.sortBy(arr2))
}

export function distanceBetweenToCoordinates (lat1, lon1, lat2, lon2, unit = 'K') {
  if ((lat1 == lat2) && (lon1 == lon2)) {
    return 0
  }
  else {
    var radlat1 = Math.PI * lat1 / 180
    var radlat2 = Math.PI * lat2 / 180
    var theta = lon1 - lon2
    var radtheta = Math.PI * theta / 180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
    if (dist > 1) {
      dist = 1
    }
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    if (unit == 'K') { dist = dist * 1.609344 }
    if (unit == 'N') { dist = dist * 0.8684 }
    return dist
  }
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
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

export function formatFullAddressFR (add) {
  // sample: "7 Impasse Gaston Monnerville, 31200 Toulouse, France"
  const info = { number: '', streetName: '', postalCode: '', cityName: '' }

  const addressSplited = add.split(',')
  addressSplited.forEach(splited => {
    splited = splited.trim()
    const numberSplited = splited.split(' ')
    let addAdress = splited

    if (Number.isInteger(+numberSplited[0])) {
      if (info.number === '') {
        info.number = +numberSplited[0]
      } else if (info.postalCode === '') {
        info.postalCode = +numberSplited[0]
      }

      addAdress = numberSplited.slice(1).join(' ')
    }

    if (info.streetName === '') {
      info.streetName = addAdress
    } else if (info.cityName === '') {
      info.cityName = addAdress
    }
  })

  return info
}

export const snakeToCamel = (str) => str.replace(
  /([-_][a-z])/g,
  (group) => group.toUpperCase()
    .replace('-', '')
    .replace('_', '')
)
export const snakeToCamelObject = (object) => {
  if(!object) {
    return null
  }

  const objectReturn = {}
  for (const [key, value] of Object.entries(object)) {
    objectReturn[snakeToCamel(key)] = value
  }

  return objectReturn
}
export const snakeToCamelArray = (list) => {
  for (var i = 0; i < list.length; i++) {
    list[i] = snakeToCamelObject(list[i])
  }

  return list
}

export const camel_to_snake = str => str[0].toLowerCase() + str.slice(1, str.length).replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)

export const camel_to_snake_object = (object) => {
  const objectReturn = {}
  for (const [key, value] of Object.entries(object)) {
    objectReturn[camel_to_snake(key)] = value
  }

  return objectReturn
}

export const getMinMaxFromCoordinate = (latitude, longitude, distance) => {
  const newCoordinates = getBoundsOfDistance(
    { latitude, longitude },
    distance * 6 / 8 // TODO bug need 6 km and gived 8 km
  )

  return {
    minLat: newCoordinates[0].latitude,
    maxLat: newCoordinates[1].latitude,
    minLon: newCoordinates[0].longitude,
    maxLon: newCoordinates[1].longitude,
  }
}

export const orderGetQuantity = (order) => {
  if (order) {
    return sumBy(order.products || [], 'quantity')
  }

  return 0
}

export const orderGetSumTTC = (order) => {
  let total = 0

  if (order) {
    (order.products || []).map((p) => {
      total += productGetSumTTC(p)
    })
  }

  return total
}

export const productGetSumTTC = (product) => {
  let total = 0

  if (product.original_price) {
    total += product.original_price * product.quantity
  }

  (product.accompanyings || []).map(acc => {
    total += (acc.original_price * acc.quantity) * product.quantity
  })

  return total
}

export const orderGetSumHT = (order) => {
  let total = 0

  if (order) {
    (order.products || []).map((p) => {
      total += productGetSumHT(p)
    })
  }

  return total
}

export const productGetSumHT = (product) => {
  let total = 0

  const vat = product.original_tva / 100
  const price = product.original_price

  if (price) {
    total += (price * product.quantity) / (1 + vat)
  }

  (product.accompanyings || []).map(acc => {
    const vatAccomp = acc.original_vat_percent / 100
    const priceAccomp = acc.original_price

    total += (priceAccomp * acc.quantity) / (1 + vatAccomp)
  })

  return fixDecimal(total)
}

export const orderGetTVA = (order) => {
  let total = 0

  if (order) {
    (order.products || []).map((p) => {
      const price = (p.original_price || p['food.price']) * p.quantity
      total += price * (p['food.tva'] / 100)
    })
  }

  return total
}

export const orderGetHT = (order) => {
  let total = 0

  if (order) {
    (order.products || []).map((p) => {
      const price = (p.original_price || p['food.price']) * p.quantity
      total += price * ((100 - p['food.tva']) / 100)
    })
  }

  return total
}

export const dayOfDate = (date) => {
  const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
  return newDate
}

export const dayOfMonth = (date) => {
  const newDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0)
  return newDate
}

export const base64ToBuffer = (base64Image) => {
  const parts = base64Image.split(';')
  const imageData = parts[1].split(',')[1]

  return new Buffer(imageData, 'base64')
}

export const base64ToResize = (base64Image, widthMax, heightMax) => {
  if((base64Image || '').startsWith('base64') === false) {
    return new Promise((resolve) => {
      resolve(base64Image)
    })
  }

  return new Promise((resolve, reject) => {
    Jimp.read(base64ToBuffer(base64Image), (err, image) => {
      if (err) {
        reject(err)
      } else {
        if (image.bitmap.width > widthMax || image.bitmap.height > heightMax) {
          image
            .scaleToFit(widthMax, heightMax)
            .getBase64(Jimp.MIME_JPEG, function (err, src) {
              if (err) {
                reject(err)
              } else {
                resolve(src)
              }
            })
        } else {
          image
            .getBase64(Jimp.MIME_JPEG, function (err, src) {
              if (err) {
                reject(err)
              } else {
                resolve(src)
              }
            })
        }
      }
    })
  })
}

export const getRandownNumberString = (length) => {
  let stringNumber = ''
  const textArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

  for (let i = 0; i < length; i++) {
    const randomNumber = Math.floor(Math.random() * textArray.length)
    stringNumber += textArray[randomNumber]
  }

  return stringNumber
}

export async function axiosError (fct) {
  try {
    const data = await fct()
    console.log(`HTTP REQUEST ${data.config.method} : ${data.config.url}`)
    return data.data
  } catch(err) {
    if(err.response && err.response.data) {
      console.error({
        config: err.response.config,
        data: err.response.data,
      })
      console.error(JSON.stringify(err.response.data))
    } else {
      console.error(err)
    }

    throw err
  }
}

/**
 * @desc transforms an Object into an array of key-value pairs
 * @todo check if this is right => currently returns array of values and use interface KeyValue
 */
export function objValToArray (obj) {
  return Object.keys(obj).map(k => obj[k])
}
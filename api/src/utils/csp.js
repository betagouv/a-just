import { readFileSync, writeFileSync } from 'fs'
import config from 'config'
import crypto from 'crypto'
import { crypt } from './'

/**
 * Parse les fichiers en fonction du style pour avoir les sha-256
 * @param {*} filesPath
 * @returns
 */
export const styleSha1Generate = (filesPath = []) => {
  let list = []
  for (let i = 0; i < filesPath.length; i++) {
    list = list.concat(parseFile(filesPath[i], 'style'))
  }

  return list.map((i) => `'${i}'`)
}

/**
 * Parse les fichiers en fonction du script pour avoir les sha-256
 * @param {*} filesPath
 * @returns
 */
export const scriptSha1Generate = (filesPath = []) => {
  let list = []
  for (let i = 0; i < filesPath.length; i++) {
    list = list.concat(parseFile(filesPath[i], 'script'))
  }

  return list.map((i) => `'${i}'`)
}

/**
 * Retour les sha-256 pour un fichier
 * @param {*} filePath
 * @param {*} tag
 * @returns
 */
const parseFile = (filePath, tag) => {
  const list = []
  try {
    if (config.envName === 'DEV') {
      filePath = filePath.replace('/front', '/../dist/front')
    }
    console.log('filePath', filePath)
    let data = readFileSync(filePath, 'utf8')

    const key = crypt.generateRandomNumber(12)
    const newNonce = 'dt' + key
    data = data.replace(/random_nonce_value/gim, newNonce)
    writeFileSync(filePath, data)
    list.push('nonce-' + newNonce)

    //console.log('data', data)
    const regexp = new RegExp(`<${tag}(.*?)>(.*?)<\\/${tag}>`, 'gm')
    const regexp2 = new RegExp(`<${tag}>(.*?)<\\/${tag}>`, 'gm')
    const tab = [...data.matchAll(regexp), ...data.matchAll(regexp2)]
    //console.log('data', [...data.matchAll(regexp)])
    //console.log('data2', [...data.matchAll(regexp2)])
    //console.log('tab', filePath, tag, regexp, regexp2, tab)

    if (tab) {
      tab.map((l) => {
        if (l.length >= 2) {
          //console.log('find', l)
          const shasum = crypto.createHash('sha1')
          shasum.update(l[2])
          const generatedHash = shasum.digest('hex')
          list.push(`sha256-${generatedHash}`)
        }
      })
    }
  } catch (err) {
    console.log(err)
  }

  return list
}

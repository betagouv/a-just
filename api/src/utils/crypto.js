import bcrypt from 'bcryptjs'
import cryptoM from 'crypto'
import config from 'config'
import jwt from 'jsonwebtoken'

let _instance = null
/**
 * Class pour le cryptage
 */
export default class Crypto {
  /**
   * Constructeur
   */
  constructor () {
    this.lengthPassword = 10
    this.privateKey = 'aAc97e_hiF'
  }

  /**
   * Get crypto object
   */
  static get instance () {
    if (_instance === null) {
      _instance = new Crypto()
    }
    return _instance
  }

  /**
   * Cryptage de mot de passe
   * @param {*} password
   * @returns hash
   */
  encryptPassword (password) {
    return bcrypt.hashSync(password, this.lengthPassword)
  }

  /**
   * Test une chaine de caractère avec un hash
   * @param {*} password
   * @param {*} passwordEncrypt
   * @returns boolean indiquant si la string match avec le hash
   */
  compartPassword (password, passwordEncrypt = '') {
    return bcrypt.compareSync(password, passwordEncrypt ? passwordEncrypt : ' ')
  }

  /**
   * Génération de mot de passe
   * @returns mot de passe
   */
  generatePassword () {
    return Math.random().toString(36).slice(-8)
  }

  /**
   * Génération de token
   * @returns token
   */
  generateToken () {
    return cryptoM.randomBytes(128).toString('base64')
  }

  /**
   * Génération d'un nom de fichier
   * @returns nom de fichier
   */
  generateFileName () {
    return `${new Date().getTime()}__${this.getRandomString(32)}`
  }

  /**
   * Génération d'un Json Web Token
   * @param {*} data
   * @returns JSON WEB TOKEN
   */
  generateJwtToken (data) {
    return jwt.sign(data, config.jsonwebtoken.private_key)
  }

  /**
   * Retourne la donnée contenu dans un Json Web Token
   * @param {*} token
   * @returns JSON WEB TOKEN data
   */
  getDataJwtToken (token) {
    try {
      return jwt.verify(token, config.jsonwebtoken.private_key)
    } catch (error) {
      return null
    }
  }

  /**
   * Retourne objet uuidV4
   * @returns
   */
  uuid () {
    return uuidV4()
  }

  /**
   * Génération d'un chaine de caractère aléatoire
   * @param {*} nbChar
   * @returns chaine de caractère aléatoire cryptée
   */
  getRandomString (nbChar = 64) {
    return cryptoM.randomBytes(nbChar).toString('hex').substring(0, nbChar)
  }

  /**
   * Génération de nombre random
   * @param {*} maxLength
   * @returns nombre random
   */
  generateRandomNumber (maxLength = 4) {
    let s = ''
    for (let i = 0; i < maxLength; i++) {
      s += Math.floor(Math.random() * 10)
    }

    return s
  }
}

export const crypto = Crypto.instance

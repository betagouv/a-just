import bcrypt from 'bcryptjs'
import cryptoM from 'crypto'
import config from 'config'
import jwt from 'jsonwebtoken'

const uuidV4 = require('uuid/v4')

let _instance = null

export default class Crypto {
  constructor () {
    this.lengthPassword = 10
    this.privateKey = 'aAc97e_hiF'
  }

  static get instance () {
    if (_instance === null) {
      _instance = new Crypto()
    }
    return _instance
  }

  encryptPassword (password) {
    return bcrypt.hashSync(password, this.lengthPassword)
  }

  compartPassword (password, passwordEncrypt = '') {
    return bcrypt.compareSync(password, passwordEncrypt ? passwordEncrypt : ' ')
  }

  generatePassword () {
    return Math.random()
      .toString(36)
      .slice(-8)
  }

  generateToken () {
    return cryptoM.randomBytes(128).toString('base64')
  }

  generateFileName () {
    return `${new Date().getTime()}__${this.getRandomString(32)}`
  }

  generateJwtToken (data) {
    return jwt.sign(data, config.jsonwebtoken.private_key)
  }

  getDataJwtToken (token) {
    try {
      return jwt.verify(token, config.jsonwebtoken.private_key)
    } catch (error) {
      return null
    }
  }

  uuid () {
    return uuidV4()
  }

  getRandomString (nbChar = 64) {
    return cryptoM
      .randomBytes(nbChar)
      .toString('hex')
      .substring(0, nbChar)
  }

  generateRandomNumber (maxLength = 4) {
    let s = ''
    for (let i = 0; i < maxLength; i++) {
      s += Math.floor(Math.random() * 10)
    }

    return s
  }
}

export const crypto = Crypto.instance

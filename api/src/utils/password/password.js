import { crypt } from '../'
import { readFileSync } from 'fs'

let ALL_RESTRICTED_PASSWORDS = []
const MIN_PASSWORD_LENGTH = 8

/**
 * Renforcement des mots de passes lors de l'enregistrement de celui-ci
 *
 * Règle 1 : Il ne peut pas contenir les mêmes mots que dans l'identifiant.
 * Règle 2 : Il faut faire au minimum 8 caractères.
 * Règle 3 : Il ne doit pas faire parti des mots de passe interdit (liste en anexe)
 */

export const cryptPassword = (newPassword, email = '') => {
  newPassword = formatPassword(newPassword)
  initPasswordWord()
  checkPassword(newPassword, email)

  // crypt password
  newPassword = crypt.encryptPassword(newPassword)

  return newPassword
}

export const comparePasswords = (password, cryptedPassword) => {
  const formatedPassword = formatPassword(password)

  // accept l'ancien format des mots de passe
  return crypt.compartPassword(password, cryptedPassword) || crypt.compartPassword(formatedPassword, cryptedPassword)
}

/**
 * Control password from local rules and restricted password
 * @param {*} newPassword
 */
const checkPassword = (newPassword, email = '') => {
  const emailFormated = formatPassword(email).split(/[\s,.@]+/)


  var arrayOfSp = ["!", "@", "#", "$", "%", "&", "*", "_", "?", "-"];
  var regex = "[" + arrayOfSp.join("") + "]";
  if (newPassword.length < MIN_PASSWORD_LENGTH || !newPassword.match(/[A-Z]/g) || !new RegExp(regex).test(newPassword) || !newPassword.match(/\d/)) {
    throw `Pour assurer la sécurité de votre compte, veuillez choisir un mot de passe comportant au moins ${MIN_PASSWORD_LENGTH} caractères, incluant au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial.`
  }

  if (ALL_RESTRICTED_PASSWORDS.includes(newPassword) || emailFormated.includes(newPassword)) {
    throw "Ce mot de passe n'est pas autorisé!"
  }
}

/**
 * Format password
 * @param {*} newPassword
 */
const formatPassword = (newPassword) => {
  newPassword = (newPassword || '').trim()
  newPassword = newPassword.replace(/[\x00-\x1F\x80-\xFF]/gm, '') // eslint-disable-line

  return newPassword
}

/**
 * Liste de chargement des mots de passe
 */
const initPasswordWord = () => {
  if (ALL_RESTRICTED_PASSWORDS.length) {
    return
  }

  const data = readFileSync(__dirname + '/forbidden-passwords.txt', 'utf8')
  if (data) {
    const list = data.toLocaleLowerCase().split('\n')
    ALL_RESTRICTED_PASSWORDS = list
  }
}

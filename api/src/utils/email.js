import { BrevoClient } from '@getbrevo/brevo'
import config from 'config'
import { SENDING_BLUE_USER_LIST_ID } from '../constants/email'

const brevo = new BrevoClient({ apiKey: config.sendinblue })

/**
 * Envoi de mail
 * @param {*} to
 * @param {*} templateId
 * @param {*} params
 * @returns instance de transaction mail
 */
export function sentEmail(to, templateId, params, options = {}) {
  if (!config.sentEmail) {
    console.log('TEST Mail sent', {
      to: [to],
      templateId,
      params: { ...params, envName: config.displayEnvName },
    })
    return new Promise((resolve) => {
      resolve()
    })
  }

  return brevo.transactionalEmails.sendTransacEmail({
    to: [to],
    templateId,
    params: { ...params, envName: config.displayEnvName },
    ...options,
  }).then(
    () => {
      console.log('Mail sent', { to, templateId, params, options })
    },
    (err) => {
      console.error(err)
    }
  )
}

/**
 * Import/supprime contact sendinblue
 * @param {*} user
 * @param {*} addToList
 * @returns
 */
export function sentEmailSendinblueUserList(user, addToList = true) {
  if (addToList) {
    const isCA = Number(config.juridictionType) === 1
    const isTJ = Number(config.juridictionType) === 0

    const colonnes = []
    const values = []
    if (isCA) {
      colonnes.push('CA');
      values.push('Yes');
    }
    if (isTJ) {
      colonnes.push('TJ');
      values.push('Yes');
    }

    return brevo.contacts.importContacts({
      fileBody: `EMAIL; NOM; PRENOM; SMS; PUBLIC_TOKEN; ${colonnes.join(';')}\n${user.email};${user.first_name};${user.last_name};;;${values.join(';')}`,
      listIds: [SENDING_BLUE_USER_LIST_ID],
      emailBlacklist: false,
      smsBlacklist: false,
      updateExistingContacts: true,
      emptyContactsAttributes: false,
    }).then(
      (data) => {
        console.log('ADD - API called successfully. Returned data: ' + JSON.stringify(data))
      },
      (err) => {
        console.error(err)
      }
    )
  }

  return brevo.contacts.removeContactFromList({
    listId: SENDING_BLUE_USER_LIST_ID,
    body: { emails: [user.email] },
  }).then(
    (data) => {
      console.log('REMOVE - API called successfully. Returned data: ' + JSON.stringify(data))
    },
    (err) => {
      console.error(err)
    }
  )
}
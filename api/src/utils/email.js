var SibApiV3Sdk = require('sib-api-v3-sdk')
import config from 'config'
import { SENDING_BLUE_USER_LIST_ID } from '../constants/email'
var defaultClient = SibApiV3Sdk.ApiClient.instance

// Configure API key authorization: api-key
var apiKey = defaultClient.authentications['api-key']
apiKey.apiKey = config.sendinblue

/**
 * Envoi de mail
 * @param {*} to
 * @param {*} templateId
 * @param {*} params
 * @returns instance de transaction mail
 */
export function sentEmail (to, templateId, params, options = {}) {
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

  var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
  var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
  sendSmtpEmail = {
    to: [to],
    templateId,
    params: { ...params, envName: config.displayEnvName },
    ...options,
  }

  return apiInstance.sendTransacEmail(sendSmtpEmail).then(
    function () {
      console.log('Mail sent', sendSmtpEmail)
    },
    function (err) {
      if (err && err.response && err.response.body) {
        console.log(err.response.body)
      } else {
        console.error(err.text || err)
      }
    }
  )
}

/**
 * Import/supprime contact sendinblue
 * @param {*} user
 * @param {*} addToList
 * @returns
 */
export function sentEmailSendinblueUserList (user, addToList = true) {
  let apiInstance = new SibApiV3Sdk.ContactsApi()

  if (addToList) {
    let requestContactImport = new SibApiV3Sdk.RequestContactImport()

    requestContactImport.fileBody = `EMAIL;NOM;PRENOM;SMS;PUBLIC_TOKEN;\n${user.email};${user.first_name};${user.last_name};;`
    requestContactImport.listIds = [SENDING_BLUE_USER_LIST_ID]
    requestContactImport.emailBlacklist = false
    requestContactImport.smsBlacklist = false
    requestContactImport.updateExistingContacts = true
    requestContactImport.emptyContactsAttributes = false

    return apiInstance.importContacts(requestContactImport).then(
      function (data) {
        console.log('ADD - API called successfully. Returned data: ' + JSON.stringify(data))
      },
      function (err) {
        if (err && err.response && err.response.body) {
          console.log(err.response.body)
        } else {
          console.error(err.text || err)
        }
      }
    )
  } else {
    let contactEmails = new SibApiV3Sdk.RemoveContactFromList()

    contactEmails.emails = [user.email]

    return apiInstance.removeContactFromList(SENDING_BLUE_USER_LIST_ID, contactEmails).then(
      function (data) {
        console.log('REMOVE - API called successfully. Returned data: ' + JSON.stringify(data))
      },
      function (err) {
        if (err && err.response && err.response.body) {
          console.log(err.response.body)
        } else {
          console.error(err.text || err)
        }
      }
    )
  }
}

var SibApiV3Sdk = require('sib-api-v3-sdk')
import config from 'config'
import {
  SENDING_BLUE_LIST_DELIVERS,
  SENDING_BLUE_LIST_USERS,
  SENDING_BLUE_LIST_USERS_RESTAURANT,
  TEMPLATE_DEFAULT_RESTAURANT_CAMPAGN,
} from '../constants/email'
var defaultClient = SibApiV3Sdk.ApiClient.instance

// Configure API key authorization: api-key
var apiKey = defaultClient.authentications['api-key']
apiKey.apiKey = config.sendinblue

export function sentEmail (to, templateId, params) {
  var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
  var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
  sendSmtpEmail = {
    to: [to],
    templateId,
    params,
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

export function sentSendingBlueSms (to, content) {
  let apiInstance = new SibApiV3Sdk.TransactionalSMSApi()

  let sendTransacSms = new SibApiV3Sdk.SendTransacSms()

  sendTransacSms = {
    sender: 'Delivreetic',
    recipient: (to || '').replace(/\+/, ''),
    content,
  }

  return apiInstance.sendTransacSms(sendTransacSms).then(
    function (data) {
      console.log(
        'API called successfully. Returned data: ' + JSON.stringify(data)
      )
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
export function sentEmailCampagnToRestaurants (title, params) {
  let apiInstance = new SibApiV3Sdk.EmailCampaignsApi()
  let emailCampaigns = new SibApiV3Sdk.CreateEmailCampaign()
  const date = new Date()

  emailCampaigns = {
    tag: 'restaurateurs',
    sender: { name: 'Delivreetic', email: 'contact@delivreetic.com' },
    name: title,
    templateId: TEMPLATE_DEFAULT_RESTAURANT_CAMPAGN,
    scheduledAt: date,
    subject: title,
    replyTo: 'contact@delivreetic.com',
    toField: '{{contact.PRENOM}} {{contact.NOM}}',
    recipients: { listIds: [SENDING_BLUE_LIST_USERS_RESTAURANT] },
    inlineImageActivation: false,
    mirrorActive: false,
    recurring: false,
    type: 'classic',
    utmCampaign: 'restaurants-' + title,
    params: {
      ...params,
      'unsubscribecampagn': `${config.restaurantUrl}unsubscribe/`
        .replace('https://', '')
        .replace('http://', ''),
    },
  }
  apiInstance.createEmailCampaign(emailCampaigns).then(
    function (data) {
      console.log(
        'API called successfully. Returned data: ' + JSON.stringify(data)
      )
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

export function sentEmailRestaurantList (user) {
  let apiInstance = new SibApiV3Sdk.ContactsApi()

  if (user.newsletter_restaurant) {
    let requestContactImport = new SibApiV3Sdk.RequestContactImport()

    requestContactImport.fileBody = `EMAIL;NOM;PRENOM;SMS;PUBLIC_TOKEN;\n${user.email};${user.first_name};${user.last_name};${user.phone};${user.public_token}`
    requestContactImport.listIds = [SENDING_BLUE_LIST_USERS_RESTAURANT]
    requestContactImport.emailBlacklist = false
    requestContactImport.smsBlacklist = false
    requestContactImport.updateExistingContacts = true
    requestContactImport.emptyContactsAttributes = false

    return apiInstance.importContacts(requestContactImport).then(
      function (data) {
        console.log(
          'API called successfully. Returned data: ' + JSON.stringify(data)
        )
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

    return apiInstance
      .removeContactFromList(SENDING_BLUE_LIST_USERS_RESTAURANT, contactEmails)
      .then(
        function (data) {
          console.log(
            'API called successfully. Returned data: ' + JSON.stringify(data)
          )
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

export function sentEmailUserList (user) {
  let apiInstance = new SibApiV3Sdk.ContactsApi()

  if (user.newsletter) {
    let requestContactImport = new SibApiV3Sdk.RequestContactImport()

    requestContactImport.fileBody = `EMAIL;NOM;PRENOM;SMS;PUBLIC_TOKEN;\n${user.email};${user.first_name};${user.last_name};${user.phone};${user.public_token}`
    requestContactImport.listIds = [SENDING_BLUE_LIST_USERS]
    requestContactImport.emailBlacklist = false
    requestContactImport.smsBlacklist = false
    requestContactImport.updateExistingContacts = true
    requestContactImport.emptyContactsAttributes = false

    return apiInstance.importContacts(requestContactImport).then(
      function (data) {
        console.log(
          'API called successfully. Returned data: ' + JSON.stringify(data)
        )
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

    return apiInstance
      .removeContactFromList(SENDING_BLUE_LIST_USERS, contactEmails)
      .then(
        function (data) {
          console.log(
            'API called successfully. Returned data: ' + JSON.stringify(data)
          )
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

export function sentEmailDeliverList (user, add = true) {
  let apiInstance = new SibApiV3Sdk.ContactsApi()

  if (add) {
    let requestContactImport = new SibApiV3Sdk.RequestContactImport()

    requestContactImport.fileBody = `EMAIL;NOM;PRENOM;SMS;PUBLIC_TOKEN;\n${user.email};${user.first_name};${user.last_name};${user.phone};${user.public_token}`
    requestContactImport.listIds = [SENDING_BLUE_LIST_DELIVERS]
    requestContactImport.emailBlacklist = false
    requestContactImport.smsBlacklist = false
    requestContactImport.updateExistingContacts = true
    requestContactImport.emptyContactsAttributes = false

    return apiInstance.importContacts(requestContactImport).then(
      function (data) {
        console.log(
          'API called successfully. Returned data: ' + JSON.stringify(data)
        )
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

    return apiInstance
      .removeContactFromList(SENDING_BLUE_LIST_DELIVERS, contactEmails)
      .then(
        function (data) {
          console.log(
            'API called successfully. Returned data: ' + JSON.stringify(data)
          )
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
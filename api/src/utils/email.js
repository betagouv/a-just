var SibApiV3Sdk = require('sib-api-v3-sdk')
import config from 'config'
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
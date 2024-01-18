import { readFileSync } from 'fs'
import saml2 from 'saml2-js'
import config from 'config'

var sp_options = {
  entity_id: `${config.serverUrl}/saml/metadata.xml`,
  private_key: readFileSync(`${__dirname}/../../certificats-sso/privateKey.pem`).toString(),
  certificate: readFileSync(`${__dirname}/../../certificats-sso/certificate.crt`).toString(),
  assert_endpoint: `${config.serverUrl}/saml/assert`,
  force_authn: true,
  auth_context: { comparison: 'exact', class_refs: ['urn:oasis:names:tc:SAML:1.0:am:password'] },
  nameid_format: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
  sign_get_request: false,
  allow_unencrypted_assertion: true,
}

// Call service provider constructor with options
export const sp = new saml2.ServiceProvider(sp_options)

// Create identity provider
var idp_options = {
  sso_login_url: `${config.sso.url}`,
  sso_logout_url: `${config.sso.url}/logout`,
  //certificates: [readFileSync('cert-file1.crt').toString(), fs.readFileSync('cert-file2.crt').toString()],
}
export const idp = new saml2.IdentityProvider(idp_options)

export const loginSSO = () => {
  return new Promise((resolve, reject) => {
    sp.create_login_request_url(idp, {}, function (err, login_url, request_id) {
      console.log(idp, err, login_url, request_id)
      if (err != null) {
        reject(err)
      } else {
        resolve(login_url)
      }
    })
  })
}

export const logoutSSO = (options) => {
  return new Promise((resolve, reject) => {
    sp.create_logout_request_url(idp, options, function (err, logout_url) {
      console.log(idp, err, logout_url)
      if (err != null) {
        reject(err)
      } else {
        resolve(logout_url)
      }
    })
  })
}

export const postAssertSSO = (requestBody) => {
  return new Promise((resolve, reject) => {
    sp.post_assert(idp, { request_body: requestBody }, function (err, saml_response) {
      console.log(saml_response)
      if (err != null) {
        reject(err)
      } else {
        resolve({ nameId: saml_response.user.name_id, sessionIndex: saml_response.user.session_index })
      }
    })
  })
}

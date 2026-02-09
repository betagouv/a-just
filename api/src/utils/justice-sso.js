import saml2 from 'saml2-js'
import config from 'config'

var sp_options = {
  entity_id: `${config.serverUrl}/saml/metadata.xml`,
  private_key: config.sso.privateKey, //     private_key: fs.readFileSync("key-file.key").toString(),
  certificate: config.sso.publicKey, //     certificate: fs.readFileSync("cert-file.crt").toString(),
  assert_endpoint: `${config.serverUrl}/saml/assert-return`,
  force_authn: true,
  auth_context: { comparison: 'exact', class_refs: ['urn:oasis:names:tc:SAML:1.0:am:password'] },
  nameid_format: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
  sign_get_request: true,
  allow_unencrypted_assertion: true,
}

// Call service provider constructor with options
export const sp = new saml2.ServiceProvider(sp_options)

// Create identity provider

// https://nantes.sso.intranet.justice.gouv.fr
// nouveau => https://auth.sso.intranet.justice.gouv.fr

var idp_options = {
  sso_login_url: `${config.sso.url}/saml/singleSignOn`,
  sso_logout_url: `${config.sso.url}/saml/singleLogout`,
  certificates: [
    (config.sso.ssoExternalPublicKey || '').replace(/ /g, '').replace(/\\n/g, ''),
    (config.sso.ssoExternalPublicKey || '').replace(/ /g, '').replace(/\\n/g, ''),
  ],
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
      console.log(JSON.stringify(saml_response))
      /**
       * Exemple de retour
       * {"response_header":{"version":"2.0","destination":"https://a-just.incubateur.net/api/saml/assert-return","in_response_to":"_4096398212cc124d92684962d856aeddab1165ed5a","id":"_EBCBE3560C5AA612F647DA351B07301B"},"type":"authn_response","user":{"name_id":"_C65A794EDBDB5D494116B510D8607B7C","session_index":"QRKbkPL6ucP1gf3vj4p3fsBpZ60NoMaX9g5lH/nXo5yui9gPbJeeoob+r8NM3etGI8umGO2vJ7cT7mb/ESU/KA==","session_not_on_or_after":"2024-02-28T07:44:46Z","attributes":{"roles":["A_JUST_DEV:USER"],"nom":["MONTIGNY"],"affectationOp3":[],"logonId":["francois-xavier.mont"],"affectationOp4":[],"siteDescription":[],"prenom":["François-Xavier"],"igcid":["L0340347"],"affectationOp2":[],"bureauIGC":[],"mail":["francois-xavier.montigny@justice.gouv.fr"]}}}
       */
      if (err != null) {
        reject(err)
      } else {
        resolve({
          nameId: saml_response.user.name_id,
          sessionIndex: saml_response.user.session_index,
          email: saml_response.user.attributes?.mail[0],
          firstName: saml_response.user.attributes?.prenom[0],
          lastName: saml_response.user.attributes?.nom[0],
        })
      }
    })
  })
}

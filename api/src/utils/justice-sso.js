import saml2 from 'saml2-js'
import config from 'config'

var sp_options = {
  entity_id: `${config.serverUrl}/saml/metadata.xml`,
  private_key: config.sso.privateKey,
  certificate: config.sso.publicKey,
  assert_endpoint: `${config.serverUrl}/saml/assert-return`,
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
  sso_login_url: `${config.sso.url}/saml/singleSignOn`,
  sso_logout_url: `${config.sso.url}/logout`,
  certificates: [
    'MIIDkDCCAngCCQCqblG3IBmk/DANBgkqhkiG9w0BAQUFADCBiTELMAkGA1UEBhMC RlIxDzANBgNVBAcMBk5hbnRlczELMAkGA1UECgwCTUoxFTATBgNVBAsMDFNESVQv RVREL0JVQTEWMBQGA1UEAwwNVk0tTERBUC1TU08tNTEtMCsGCSqGSIb3DQEJARYe Q2xhdWRlLkxvaXNlYXVAanVzdGljZS5nb3V2LmZyMB4XDTE1MDgxMTE3MTEwOFoX DTI1MDgwODE3MTEwOFowgYkxCzAJBgNVBAYTAkZSMQ8wDQYDVQQHDAZOYW50ZXMx CzAJBgNVBAoMAk1KMRUwEwYDVQQLDAxTRElUL0VURC9CVUExFjAUBgNVBAMMDVZN LUxEQVAtU1NPLTUxLTArBgkqhkiG9w0BCQEWHkNsYXVkZS5Mb2lzZWF1QGp1c3Rp Y2UuZ291di5mcjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJuiF1LA 2fQbpeFxaizjMsh3wPLintEMU4apHAfIbtba72qTFJ99FicqDxPi+kcqD5hVfUnx DhwSp1ZTx3zgRkR5cdcj9AAuVwCHh9Ph/1OZvFi3isLk9gDtoFqcEC7jpUaSFgsj 6vS1TkHf9j7qIVqG4Kv/D74/2Dsv6I/6zE/QodmAI3m2g2NPMM8jyuPYf3882tBe Iny6sR9OWsM92F2OcmeimhmdPE/zB7yZWB0Nn0iZQIN+MoBFrEIdnos8L63koADL mNX6bh9qrEmGzNqTObjUr/hbDl6t6QrsgNhosRR2rM8SQHlwX+Iwsssg0adBPmS7 kBq6STXjAVI+EVcCAwEAATANBgkqhkiG9w0BAQUFAAOCAQEADX2EHMYr58KctZHP gluCJKjmyGMAubl1YS0nStRyDtjxzbTunm03C+zGDDM/0wcMHN27XLJ/KXqyoSUi sYjOi3s6m29mTAGHl3e9CNg8/m6gf3ffrJTfLgALpSqNp4ShnrtJu5Sci42rYsJe L8/ywC4uy01dY+5PXJRc7BXPfHura7+f6/bUuF4H5hYjox/SBx4ZVLhyAIS81d4d raEzlyr28/q88/nyk6rEo/C4qDuQ7KRijaRvfpk41rogPU8RxeTR8MwXCdgMxwwz g8Dg7rySqUjgsn1UacMZTH2K+voFgt8mysaA/k6zAn1wU9gpxvHwgIBZE8q4clL6 y/A0AQ=='.replace(
      / /g,
      ''
    ),
    'MIIDkDCCAngCCQCqblG3IBmk/DANBgkqhkiG9w0BAQUFADCBiTELMAkGA1UEBhMC RlIxDzANBgNVBAcMBk5hbnRlczELMAkGA1UECgwCTUoxFTATBgNVBAsMDFNESVQv RVREL0JVQTEWMBQGA1UEAwwNVk0tTERBUC1TU08tNTEtMCsGCSqGSIb3DQEJARYe Q2xhdWRlLkxvaXNlYXVAanVzdGljZS5nb3V2LmZyMB4XDTE1MDgxMTE3MTEwOFoX DTI1MDgwODE3MTEwOFowgYkxCzAJBgNVBAYTAkZSMQ8wDQYDVQQHDAZOYW50ZXMx CzAJBgNVBAoMAk1KMRUwEwYDVQQLDAxTRElUL0VURC9CVUExFjAUBgNVBAMMDVZN LUxEQVAtU1NPLTUxLTArBgkqhkiG9w0BCQEWHkNsYXVkZS5Mb2lzZWF1QGp1c3Rp Y2UuZ291di5mcjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJuiF1LA 2fQbpeFxaizjMsh3wPLintEMU4apHAfIbtba72qTFJ99FicqDxPi+kcqD5hVfUnx DhwSp1ZTx3zgRkR5cdcj9AAuVwCHh9Ph/1OZvFi3isLk9gDtoFqcEC7jpUaSFgsj 6vS1TkHf9j7qIVqG4Kv/D74/2Dsv6I/6zE/QodmAI3m2g2NPMM8jyuPYf3882tBe Iny6sR9OWsM92F2OcmeimhmdPE/zB7yZWB0Nn0iZQIN+MoBFrEIdnos8L63koADL mNX6bh9qrEmGzNqTObjUr/hbDl6t6QrsgNhosRR2rM8SQHlwX+Iwsssg0adBPmS7 kBq6STXjAVI+EVcCAwEAATANBgkqhkiG9w0BAQUFAAOCAQEADX2EHMYr58KctZHP gluCJKjmyGMAubl1YS0nStRyDtjxzbTunm03C+zGDDM/0wcMHN27XLJ/KXqyoSUi sYjOi3s6m29mTAGHl3e9CNg8/m6gf3ffrJTfLgALpSqNp4ShnrtJu5Sci42rYsJe L8/ywC4uy01dY+5PXJRc7BXPfHura7+f6/bUuF4H5hYjox/SBx4ZVLhyAIS81d4d raEzlyr28/q88/nyk6rEo/C4qDuQ7KRijaRvfpk41rogPU8RxeTR8MwXCdgMxwwz g8Dg7rySqUjgsn1UacMZTH2K+voFgt8mysaA/k6zAn1wU9gpxvHwgIBZE8q4clL6 y/A0AQ=='.replace(
      / /g,
      ''
    ),
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
       * {
  response_header: {
    version: '2.0',
    destination: 'https://1deb-176-162-49-49.ngrok-free.app/api/saml/assert',
    in_response_to: '_674995339ad69de97e68926ae28821e32c2a6a182f',
    id: '_D008ED343759D3E2A323F1F4FE9BCB34'
  },
  type: 'authn_response',
  user: {
    name_id: '_1FE55BD82E773C66DD89105731B750F0',
    session_index: 'caTau3LET0bsZa8vNM91QgSV8tPjexzKbxwZsq9ni66BQn0AhMjWk3cfSaZOVKnSAJSffXiW69gY7bd3P1G34g==',
    session_not_on_or_after: '2024-01-24T11:19:58Z',
    attributes: {}
  }
}
       */
      if (err != null) {
        reject(err)
      } else {
        resolve({
          nameId: saml_response.user.name_id,
          sessionIndex: saml_response.user.session_index,
          email: saml_response.user.attributes?.email,
          firstName: saml_response.user.attributes?.prenom,
          lastName: saml_response.user.attributes?.nom,
        })
      }
    })
  })
}

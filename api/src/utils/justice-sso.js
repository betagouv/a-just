import { readFileSync } from 'fs'
import saml2 from 'saml2-js'
import config from 'config'

var sp_options = {
  entity_id: `${config.ssl.url}/metadata.xml`,
  private_key: readFileSync('key-file.pem').toString(),
  certificate: readFileSync('cert-file.crt').toString(),
  assert_endpoint: `${config.ssl.url}/assert`,
  force_authn: true,
  auth_context: { comparison: 'exact', class_refs: ['urn:oasis:names:tc:SAML:1.0:am:password'] },
  nameid_format: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
  sign_get_request: false,
  allow_unencrypted_assertion: true,
}

// Call service provider constructor with options
var sp = new saml2.ServiceProvider(sp_options)

// Example use of service provider.
// Call metadata to get XML metatadata used in configuration.
var metadata = sp.create_metadata()

console.log('META DATA sp', sp)
console.log('META DATA', metadata)

const { Readable } = require('stream')
import { Base64Encode } from 'base64-stream'

/**
 * @param binary Buffer
 * returns readableInstanceStream Readable
 */
export function bufferToStream (binary) {
  const readableInstanceStream = new Readable({
    read () {
      this.push(binary)
      this.push(null)
    },
  })

  return readableInstanceStream
}

/**
 * Converti un pdf en base 64
 * @param {*} doc
 * @returns
 */
export function getBase64Pdf (doc) {
  return new Promise((resolve) => {
    var stream = doc.pipe(new Base64Encode())
    var finalString = '' // contains the base64 string
    stream.on('data', function (chunk) {
      finalString += chunk
    })

    stream.on('end', function () {
      // the stream is at its end, so push the resulting base64 string to the response
      resolve(finalString)
    })
  })
}

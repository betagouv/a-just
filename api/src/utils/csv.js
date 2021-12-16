import parse from 'csv-parse'
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier

export function csvToArrayJson (data, options = {}) {
  return new Promise((resolve, reject) => {
    parse(data, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ';',
      trim: true,
      bom: true,
      ...options,
    }, (err, output) => {
      if(err) reject(err)
      else resolve(output)
    })
  }).then(list => (
    list.map(tab => {
      const obj = {}
      for (const p in tab) {
        obj[p.replace(/ /g,'_').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()] = tab[p]
      }

      return obj
    })
  ))
}

/**
 * 
 * columns = [
        {id: 'name', title: 'NAME'},
        {id: 'lang', title: 'LANGUAGE'}
    ]
 * 
 * records = [
    {name: 'Bob',  lang: 'French, English'},
    {name: 'Mary', lang: 'English'}
]
 */

export function csvBuffer (columns, records) {
  const csvStringifier = createCsvStringifier({
    header: columns,
  })
  const headers = csvStringifier.getHeaderString()
  const data = csvStringifier.stringifyRecords(records)
  const blobData = `${headers}${data}`

  return Buffer.from(blobData)
}
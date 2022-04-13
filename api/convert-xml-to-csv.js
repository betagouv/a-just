const xml2csv = require('@wmfs/xml2csv')

xml2csv(
  {
    xmlPath: 'S06_men_20220224-002021_RGC-CA_f05.xml',
    csvPath: 'S06_men_20220224-002021_RGC-CA_f05.csv',
    rootXMLElement: 'ROW',
    headerMap: [
      ['I_ELST', 'I_ELST', 'string'],
      ['C_TUS', 'C_TUS', 'string'],
      ['COPRO', 'COPRO', 'string'],
      ['NATAFF', 'NATAFF', 'string'],
      ['MODSAI', 'MODSAI', 'string'],
      ['MODFIN', 'MODFIN', 'string'],
      ['AUTSAI', 'AUTSAI', 'string'],
      ['AUTDJU', 'AUTDJU', 'string'],
      ['RENPAR', 'RENPAR', 'string'],
      ['DECISION', 'DECISION', 'string'],
      ['PERIODE', 'PERIODE', 'string'],
      ['NBAFF', 'NBAFF', 'string'],
      ['NBAFFDUR', 'NBAFFDUR', 'string'],
      ['SOMDUR', 'SOMDUR', 'string'],
      ['NBAFFDURDEBAT', 'NBAFFDURDEBAT', 'string'],
      ['SOMDURDEBAT', 'SOMDURDEBAT', 'string'],
      ['MINDUR', 'MINDUR', 'string'],
      ['MAXDUR', 'MAXDUR', 'string'],
      ['NBAFFSTOCK_12M', 'NBAFFSTOCK_12M', 'string'],
      ['NBAFFDAUDPLAI', 'NBAFFDAUDPLAI', 'string'],
      ['SOMDURDAUDPLAI', 'SOMDURDAUDPLAI', 'string'],
      ['NBAFFDURETAT', 'NBAFFDURETAT', 'string'],
      ['SOMDURETAT', 'SOMDURETAT', 'string'],
      ['DATMAJ', 'DATMAJ', 'string'],
    ],
  },
  function (err, result) {
    console.log(err)
    console.log(result)
  }
)

console.log('done')
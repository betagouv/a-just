import path from 'path'
import lineByLine from 'n-readlines'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs'
import { csvToArrayJson } from '../utils/csv'
import {
  TAG_JURIDICTION_ID_COLUMN_NAME,
  TAG_JURIDICTION_VALUE_COLUMN_NAME,
} from './constants/SDSE-ref'
import { orderBy } from 'lodash'
import { extractCodeFromLabelImported } from '../utils/referentiel'

export default class App {
  constructor () {}

  async start () {
    console.log('--- START ---')

    const tmpFolder = path.join(__dirname, '../tmp')
    const inputFolder = path.join(__dirname, '../inputs')
    const outputFolder = path.join(__dirname, '../outputs')
    rmSync(outputFolder, { recursive: true, force: true })
    mkdirSync(outputFolder, { recursive: true })

    rmSync(tmpFolder, { recursive: true, force: true })
    mkdirSync(tmpFolder, { recursive: true })

    const referentiel = await this.getReferentiel(inputFolder)
    console.log(referentiel)
    const juridictionMap = {} // this.getJuridictionsValues(inputFolder)
    await this.getActivitiesValues(tmpFolder, inputFolder, juridictionMap)
    await this.formatAndGroupJuridiction(tmpFolder, outputFolder, referentiel)

    this.done()
  }

  done () {
    console.log('--- DONE ---')
    process.exit()
  }

  async getJuridictionsValues (inputFolder) {
    const files = readdirSync(inputFolder).filter(
      (f) => f.endsWith('.xml') && f.indexOf('COMPTEURS') !== -1
    )
    const list = {}

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(file)

      let liner = new lineByLine(`${inputFolder}/${file}`)
      let line
      let lastId = null

      // get header
      while ((line = liner.next()) !== false) {
        const lineFormated = line.toString('ascii').trim()
        const tagName = this.getTagName(lineFormated)
        const value = this.getTagValue(lineFormated)

        if (!lastId && tagName === TAG_JURIDICTION_ID_COLUMN_NAME) {
          lastId = value
        } else if (lastId && tagName === TAG_JURIDICTION_VALUE_COLUMN_NAME) {
          list[lastId] = value
          lastId = null
        }
      }
    }

    return list
  }

  getCsvOutputPath (tmpFolder, juridiction) {
    return `${tmpFolder}/export-activities-${juridiction}.csv`
  }

  async getActivitiesValues (tmpFolder, inputFolder, juridictionMap) {
    const files = readdirSync(inputFolder).filter(
      (f) => f.endsWith('.xml') && f.indexOf('COMPTEURS') === -1
    )

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(file)

      let liner = new lineByLine(`${inputFolder}/${file}`)
      let line
      let nbLine = 0
      let secondTag = ''
      let headerMap = []
      let isEnd = false

      // get header
      while ((line = liner.next()) !== false && !isEnd) {
        const lineFormated = line.toString('ascii').trim()

        if (nbLine === 2) {
          secondTag = this.getTagName(lineFormated)
        } else if (`</${secondTag}>` === lineFormated) {
          isEnd = true
        } else if (nbLine > 2) {
          const newTag = this.getTagName(lineFormated)
          headerMap.push(newTag)
        }

        nbLine++
      }
      
      headerMap.push('type_juridiction')

      const regex = new RegExp('_RGC-(.*?)_', 'g')
      let testRegex
      let getTypeOfJuridiction
      if ((testRegex = regex.exec(file)) !== null) {
        getTypeOfJuridiction = testRegex[1]
      } else {
        break
      }

      // complete file
      liner = new lineByLine(`${inputFolder}/${file}`)
      let dataLines
      let totalLine = 0
      nbLine = 0
      while ((line = liner.next()) !== false) {
        const lineFormated = line.toString('ascii').trim()
        const tag = this.getTagName(lineFormated)

        if (tag === secondTag) {
          secondTag = this.getTagName(lineFormated)
          dataLines = headerMap.map(() => '') // create empty map
        } else if (`</${secondTag}>` === lineFormated) {
          const regexValue = new RegExp(`^${getTypeOfJuridiction}(T|N|S)`)
          if(regexValue.test(dataLines[1])) {
            // add juridiction name
            if(juridictionMap[dataLines[0]]) {
              dataLines[0] = juridictionMap[dataLines[0]]
            }

            // create file if not exist
            if(!existsSync(this.getCsvOutputPath(tmpFolder, dataLines[0]))) {
              // create file
              writeFileSync(this.getCsvOutputPath(tmpFolder, dataLines[0]), `${headerMap.join(',')}\n`)
            }

            dataLines[dataLines.length - 1] = getTypeOfJuridiction // add type of juridiction

            appendFileSync(
              this.getCsvOutputPath(tmpFolder, dataLines[0]),
              `${dataLines.join(',')}\n`
            )
            totalLine++
          }
        } else if (nbLine > 2) {
          const index = headerMap.indexOf(tag)
          if (index !== -1) {
            dataLines[index] = this.getTagValue(lineFormated)
          }
        }

        nbLine++
      }

      console.log(`add ${totalLine} lines`)
    }
  }

  getTagName (stringNotFormated) {
    let tag = stringNotFormated.trim().split('>')[0].replace(/(<|>)/g, '')
    return tag.split(' ')[0]
  }

  getTagValue (stringNotFormated) {
    let tab = stringNotFormated.trim().split('>')
    if (tab.length > 1) {
      return tab[1].trim().split('<')[0]
    }
    return ' '
  }

  async formatAndGroupJuridiction (tmpFolder, outputFolder, referentiel) {
    const files = readdirSync(tmpFolder).filter(
      (f) => f.endsWith('.csv')
    )

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const listInObject = {}

      const arrayOfCsv = await csvToArrayJson(readFileSync(`${tmpFolder}/${file}`, 'utf8'), {
        delimiter: ',',
      })
      arrayOfCsv.map(a => {
        const codeRef = referentiel[a.nataff]
        if(codeRef) {
          // only if we now the naff code

          if(!listInObject[`${a.periode}-${codeRef}`]) {
            listInObject[`${a.periode}-${codeRef}`] = {
              started: 0,
              finished: 0,
              stock: 0,
              periode: a.periode,
              codeRef,
              codesNac: [],
            }
          }

          if(listInObject[`${a.periode}-${codeRef}`].codesNac.indexOf(a.nataff) === -1) {
            listInObject[`${a.periode}-${codeRef}`].codesNac.push(a.nataff)
          }

          switch(a.c_tus.charAt(a.type_juridiction.length)) {
          case 'T':
            listInObject[`${a.periode}-${codeRef}`].finished += (+a.nbaff)
            break
          case 'N':
            listInObject[`${a.periode}-${codeRef}`].started += (+a.nbaff)
            break
          case 'S':
            listInObject[`${a.periode}-${codeRef}`].started += (+a.stock)
            break
          }
        }
      })

      const list = orderBy(Object.values(listInObject), ['periode', 'nac'], ['asc', 'asc'])
      writeFileSync(`${outputFolder}/${file.replace('.csv', '.json')}`, JSON.stringify({ list }))
    }
  }

  async getReferentiel (inputFolder) {
    const referentielFiles = readdirSync(inputFolder).filter(
      (f) => f.endsWith('.csv') && f.toLowerCase().indexOf('nomenclature') !== -1
    )
    const listInObject = {}

    if(referentielFiles) {
      for (let i = 0; i < referentielFiles.length; i++) {
        const file = referentielFiles[i]
  
        const arrayOfCsv = await csvToArrayJson(readFileSync(`${inputFolder}/${file}`, 'utf8'), {
          delimiter: ';',
        })

        arrayOfCsv.map(a => {
          let lastRefCode = ''
          
          Object.values(a).map(objectToAnalyse => {
            const extract = extractCodeFromLabelImported(objectToAnalyse)
            if(extract && extract.code) {
              lastRefCode = extract.code
            } else if(lastRefCode && (!extract || !extract.code) && !listInObject[objectToAnalyse]) {
              listInObject[objectToAnalyse] = lastRefCode
            }
          })
        })
      }
    }

    return listInObject
  }
}

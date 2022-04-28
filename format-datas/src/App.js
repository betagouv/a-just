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

    const juridictionMap = {} // this.getJuridictionsValues(inputFolder)
    await this.getActivitiesValues(tmpFolder, inputFolder, juridictionMap)
    await this.formatAndGroupJuridiction(tmpFolder, outputFolder)

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

  async formatAndGroupJuridiction (tmpFolder, outputFolder) {
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
        if(!listInObject[a.periode]) {
          listInObject[`${a.periode}-${a.nataff}`] = {
            started: 0,
            finished: 0,
            stock: 0,
            periode: a.periode,
            nac: a.nataff,
          }
        }

        switch(a.c_tus.charAt(a.type_juridiction.length)) {
        case 'T':
          listInObject[`${a.periode}-${a.nataff}`].finished += (+a.nbaff)
          break
        case 'N':
          listInObject[`${a.periode}-${a.nataff}`].started += (+a.nbaff)
          break
        case 'S':
          listInObject[`${a.periode}-${a.nataff}`].started += (+a.stock)
          break
        }
      })

      const list = orderBy(Object.values(listInObject), ['periode', 'nac'], ['asc', 'asc'])
      writeFileSync(`${outputFolder}/${file.replace('.csv', '.json')}`, JSON.stringify({ list }))
    }
  }
}

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
  authorizateIELST,
  TAG_JURIDICTION_ID_COLUMN_NAME,
  TAG_JURIDICTION_VALUE_COLUMN_NAME,
} from './constants/SDSE-ref'
import { groupBy, sumBy } from 'lodash'
import YAML from 'yaml'
import { XMLParser } from 'fast-xml-parser'

export default class App {
  constructor () {}

  async start () {
    console.log('--- START ---')

    const tmpFolder = path.join(__dirname, '../tmp')
    const inputFolder = path.join(__dirname, '../inputs')
    const outputFolder = path.join(__dirname, '../outputs')

    const categoriesOfRules = this.getRules(inputFolder)
    const referentiel = await this.getReferentiel(inputFolder)

    /*rmSync(tmpFolder, { recursive: true, force: true })
    mkdirSync(tmpFolder, { recursive: true })
    await this.getGroupByJuridiction(tmpFolder, inputFolder)*/

    rmSync(outputFolder, { recursive: true, force: true })
    mkdirSync(outputFolder, { recursive: true })
    await this.formatAndGroupJuridiction(
      tmpFolder,
      outputFolder,
      categoriesOfRules,
      referentiel
    )

    this.done()
  }

  done () {
    console.log('--- DONE ---')
    process.exit()
  }

  getRules (inputFolder) {
    const files = readdirSync(inputFolder).filter((f) => f.endsWith('.yml'))
    let categories = []

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i]
      console.log(fileName)

      const file = readFileSync(`${inputFolder}/${fileName}`, 'utf8')
      const yamlParsed = YAML.parse(file)
      categories = categories.concat(
        Object.values(yamlParsed.categories || [])
      )
    }

    return categories
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

  async getGroupByJuridiction (tmpFolder, inputFolder) {
    const files = readdirSync(inputFolder).filter(
      (f) => f.endsWith('.xml') && f.toLowerCase().indexOf('nomenc') === -1
    )

    let headerMap = []
    // generate header
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(file)

      let liner = new lineByLine(`${inputFolder}/${file}`)
      let line
      let nbLine = 0
      let secondTag = ''
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
          // merge all columns name
          if (headerMap.indexOf(newTag) === -1) {
            headerMap.push(newTag)
          }
        }

        nbLine++
      }
    }
    headerMap.push('type_juridiction')

    console.log(headerMap)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(file)

      const regex = new RegExp('_RGC-(.*?)_', 'g')
      let testRegex
      let getTypeOfJuridiction
      if ((testRegex = regex.exec(file)) !== null) {
        getTypeOfJuridiction = testRegex[1]
      } else {
        break
      }

      // complete file
      let liner = new lineByLine(`${inputFolder}/${file}`)
      let dataLines = headerMap.map(() => '') // create empty map
      let totalLine = 0
      let nbLine = 0
      let line
      let secondTag = ''
      while ((line = liner.next()) !== false) {
        const lineFormated = line.toString('ascii').trim()
        const tag = this.getTagName(lineFormated)

        if (nbLine === 2) {
          secondTag = this.getTagName(lineFormated)
        } else if (tag === secondTag) {
          secondTag = this.getTagName(lineFormated)
          dataLines = headerMap.map(() => '') // create empty map
        } else if (`</${secondTag}>` === lineFormated) {
          // create file if not exist and only for authorizes jurdiction
          const codeJuridiction = dataLines[0]
          if (authorizateIELST.indexOf(codeJuridiction) !== -1) {
            if (
              !existsSync(this.getCsvOutputPath(tmpFolder, codeJuridiction))
            ) {
              // create file
              writeFileSync(
                this.getCsvOutputPath(tmpFolder, codeJuridiction),
                `${headerMap.join(',')},\n`
              )
            }

            dataLines[dataLines.length - 1] = getTypeOfJuridiction // add type of juridiction

            appendFileSync(
              this.getCsvOutputPath(tmpFolder, codeJuridiction),
              `${dataLines.join(',')},\n`
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
        if (nbLine % 1000000 === 0) {
          console.log(nbLine)
        }
      }

      console.log(`add ${totalLine} lines add`)
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

  async formatAndGroupJuridiction (
    tmpFolder,
    outputFolder,
    categoriesOfRules,
    referentiel
  ) {
    const files = readdirSync(tmpFolder).filter((f) => f.endsWith('.csv'))

    // id, code_import, periode, stock, entrees, sorties
    // .....

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i]
      console.log(fileName)

      const arrayOfCsv = await csvToArrayJson(
        readFileSync(`${tmpFolder}/${fileName}`, 'utf8'),
        {
          delimiter: ',',
        }
      )
      const groupByMonthObject = groupBy(arrayOfCsv, 'periode')
      let list = []
      Object.values(groupByMonthObject).map((monthValues) => {
        // format string to integer
        monthValues = monthValues.map((m) => ({
          ...m,
          nbaff: m.nbaff ? parseInt(m.nbaff) : 0,
          nbaffdur: m.nbaffdur ? parseInt(m.nbaffdur) : 0,
        }))

        const formatMonthDataFromRules = this.formatMonthFromRules(
          monthValues,
          categoriesOfRules,
          referentiel
        )
        list = list.concat(formatMonthDataFromRules)
      })

      writeFileSync(
        `${outputFolder}/${fileName}`,
        `${['code_import,periode,entrees,sorties,stock,']
          .concat(
            list.map(
              (l) =>
                `${l.code_import},${l.periode},${l.entrees},${l.sorties},${l.stock},`
            )
          )
          .join('\n')}`
      )
    }
  }

  formatMonthFromRules (monthValues, categoriesOfRules, referentiel) {
    // id, code_import, periode, stock, entrees, sorties
    // .....

    const list = {}

    categoriesOfRules.map((rule) => {
      if (!list[rule['Code nomenclature']]) {
        list[rule['Code nomenclature']] = {
          entrees: 0,
          sorties: 0,
          stock: 0,
          periode: monthValues.length ? monthValues[0].periode : null,
          code_import: rule['Code nomenclature'],
        }
      }

      if (rule.filtres) {
        const nodesToUse = ['entrees', 'sorties', 'stock']
        for (let i = 0; i < nodesToUse.length; i++) {
          const node = nodesToUse[i]
          const newRules = rule.filtres[node]
          let lines = monthValues

          // EXCLUDES INCLUDES QUERIES
          Object.keys(newRules).filter(r => r !== 'TOTAL').map(ruleKey => {
            lines = this.filterDatasByNomenc(newRules, lines, ruleKey, referentiel)
          })

          // save values
          list[rule['Code nomenclature']][node] = sumBy(
            lines,
            (newRules.TOTAL || '').toLowerCase()
          )
        }
      }
    })

    return Object.values(list)
  }

  filterDatasByNomenc (rules, lines, node, referentiel) {
    let nodeValues = rules[node]
    const regexIfDifferent = new RegExp('<>(.*?)"(.*)"', 'g')
    let include = true
    let listCodeToFind = []
    if(typeof nodeValues === 'undefined') {
      return lines
    }

    // force to read array of string
    if(typeof nodeValues === 'string') {
      nodeValues = [nodeValues]
    }

    nodeValues.map(value => {
      value = value.trim() // clean string
      let label = value
      let testRegex

      if((testRegex = regexIfDifferent.exec(value)) !== null) {
        label = testRegex[2]
        include = false // warning need to be alway same
      }
      
      const findRefList = referentiel.filter(
        (r) => r.LIBELLE === label && r.TYPE_NOMENC === node
      )
      let codeList = findRefList.map(f => f.CODE)
      if(codeList.length === 0) {
        // if no code finded then find by label
        codeList = [label]
      }

      listCodeToFind = listCodeToFind.concat(codeList)
    })

    if(include) {
      lines = lines.filter((m) => listCodeToFind.indexOf(m[node.toLowerCase()]) !== -1)
    } else {
      lines = lines.filter((m) => listCodeToFind.indexOf(m[node.toLowerCase()]) === -1)
    }

    return lines
  }

  async getReferentiel (inputFolder) {
    const referentielFiles = readdirSync(inputFolder).filter(
      (f) => f.endsWith('.xml') && f.toLowerCase().indexOf('nomenc') !== -1
    )
    let list = []

    if (referentielFiles) {
      for (let i = 0; i < referentielFiles.length; i++) {
        const file = referentielFiles[i]

        const parser = new XMLParser()
        const xml = parser.parse(
          readFileSync(`${inputFolder}/${file}`, { encoding: 'utf8' })
        )

        list = list.concat(xml.ROWSET.ROW)
      }
    }

    return list
  }
}

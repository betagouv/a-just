import path from 'path'
import lineByLine from 'n-readlines'
import { appendFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs'

export default class App {
  constructor () {}

  async start () {
    console.log('--- START ---')
    await this.convertFilesToCsv()

    this.done()
  }

  done () {
    console.log('--- DONE ---')
    process.exit()
  }

  async convertFilesToCsv () {
    const tmpFolder = path.join(__dirname, '../tmp')
    const inputFolder = path.join(__dirname, '../inputs')
    rmSync(tmpFolder, { recursive: true, force: true })
    mkdirSync(tmpFolder, { recursive: true })

    const files = readdirSync(inputFolder)
      .filter((f) => f.endsWith('.xml'))

    for(let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(file)
      const csvPath = `${tmpFolder}/${file.replace('.xml', '.csv')}`

      let liner = new lineByLine(`${inputFolder}/${file}`)
      let line
      let nbLine = 0
      let secondTag = ''
      let headerMap = []
      let isEnd = false
 
      // get header
      while ((line = liner.next()) !== null && !isEnd) {
        const lineFormated = line.toString('ascii').trim()

        if(nbLine === 2) {
          secondTag = this.getTagName(lineFormated)
        } else if(`</${secondTag}>` === lineFormated) {
          isEnd = true
        } else if(nbLine > 2) {
          const newTag = this.getTagName(lineFormated)
          headerMap.push(newTag)
        }

        nbLine ++
      }

      // create file
      writeFileSync(csvPath, `${headerMap.join(',')}\n`)
      
      // complete file
      liner = new lineByLine(`${inputFolder}/${file}`)
      let dataLines
      let totalLine = 0
      nbLine = 0
      while ((line = liner.next()) !== null) {
        const lineFormated = line.toString('ascii').trim()
        const tag = this.getTagName(lineFormated)

        if(tag === secondTag) {
          secondTag = this.getTagName(lineFormated)
          dataLines = headerMap.map(() => ('')) // create empty map
        } else if(`</${secondTag}>` === lineFormated) {
          // console.log('add new line', dataLines)
          appendFileSync(csvPath, `${dataLines.join(',')}\n`)
          totalLine++
        } else if(nbLine > 2) {
          const index = headerMap.indexOf(tag)
          if(index !== -1) {
            dataLines[index] = this.getTagValue(lineFormated)
          }
        }

        nbLine ++
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
    if(tab.length > 1) {
      return tab[1].trim().split('<')[0]
    }
    return ' '
  }
}
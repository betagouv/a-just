import { Injectable, OnInit } from '@angular/core'
import { ServerService } from '../http-server/server.service'
import { saveAs } from 'file-saver'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { HRCategoryService } from '../hr-category/hr-category.service'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { month, workingDay } from 'src/app/utils/dates'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { BehaviorSubject } from 'rxjs'
import { MainClass } from 'src/app/libs/main-class'
import { HRFonctionService } from '../hr-fonction/hr-function.service'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { ReferentielService } from '../referentiel/referentiel.service'
import { sumBy } from 'lodash'
import { UserService } from '../user/user.service'
import * as FileSaver from 'file-saver'

const startCurrentSituation = month(new Date(), -12)
const endCurrentSituation = month(new Date(), -1, 'lastday')
const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
const EXCEL_EXTENSION = '.xlsx'

@Injectable({
  providedIn: 'root',
})
export class ExcelService extends MainClass implements OnInit {
  categories: HRCategoryInterface[] = []
  fonctions: HRFonctionInterface[] = []
  allReferentiels: ContentieuReferentielInterface[] = []
  dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(
    startCurrentSituation
  )
  dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(
    endCurrentSituation
  )
  loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  selectedCategory: BehaviorSubject<string> = new BehaviorSubject<string>('')
  data: Array<any> = []

  constructor(
    private humanResourceService: HumanResourceService,
    private hrCategoryService: HRCategoryService,
    private hrFonctionService: HRFonctionService,
    private referentielService: ReferentielService,
    private userService: UserService
  ) {
    super()

    this.watch(this.dateStart.subscribe((value) => {}))

    this.watch(this.dateStop.subscribe((value) => {}))
  }

  ngOnInit(): void {}

  exportExcel(): void {
    this.referentielService.loadReferentiels().then((value) => {
      this.loading.next(true)
      this.allReferentiels = value

      for (let i = 0; i < this.allReferentiels.length; i++) {
        if (this.allReferentiels[i].childrens)
          for (
            let y = this.allReferentiels[i].childrens!.length - 1;
            y >= 0;
            y--
          ) {
            this.allReferentiels.splice(
              i + 1,
              0,
              this.allReferentiels[i].childrens![y]
            )
          }
      }

      this.hrCategoryService.getAll().then((list) => {
        this.categories = list
        this.hrFonctionService.getAll().then((listfct) => {
          this.fonctions = listfct
          this.data = []
          const allHuman = this.humanResourceService.hr.getValue()

          allHuman.map((human) => {
            let categoryName = ''
            let fonctionName = ''

            const currentSituation =
              this.humanResourceService.findSituation(human)
            if (currentSituation && currentSituation.category) {
              const findCategory = this.categories.find(
                // @ts-ignore
                (c) => c.id === currentSituation.category.id
              )
              categoryName = findCategory
                ? findCategory.label.toLowerCase()
                : ''
            } else {
              console.log({ error: human })
            }

            if (currentSituation && currentSituation.fonction) {
              const findFonction = this.fonctions.find(
                // @ts-ignore
                (f) => f.id === currentSituation.fonction.id
              )
              fonctionName = findFonction
                ? findFonction.label.toLowerCase()
                : ''
            } else {
              console.log({ error: human })
            }

            let etpAffected: any = []
            let refObj: { [key: string]: any } = {}
            let totalEtpt = 0

            this.allReferentiels.map(
              (referentiel: ContentieuReferentielInterface) => {
                etpAffected = this.getHRVentilation(human, referentiel, [
                  ...this.categories,
                ]) as Array<any>

                let counterEtpTotal = 0
                let counterEtpSubTotal = 0

                Object.keys(etpAffected).map((key: string) => {
                  if (referentiel.childrens !== undefined) {
                    counterEtpTotal += etpAffected[key].etpt
                  } else counterEtpSubTotal += etpAffected[key].etpt
                })

                if (referentiel.childrens !== undefined) {
                  refObj['TOTAL ' + referentiel.label.toUpperCase()] =
                    counterEtpTotal
                  totalEtpt += counterEtpTotal
                } else {
                  refObj[referentiel.label.toUpperCase()] = counterEtpSubTotal
                }
              }
            )

            if (
              categoryName === this.selectedCategory.getValue() ||
              this.selectedCategory.getValue() === 'tous'
            )
              this.data.push({
                Numéro_A_JUST: human.id,
                Prénom: human.firstName,
                Nom: human.lastName,
                Catégorie: categoryName,
                Fonction: fonctionName,
                ETPT: totalEtpt,
                ...refObj,
              })
          })

          import('xlsx').then((xlsx) => {
            this.data.sort((a, b) =>
              a.last_nom > b.Fonction ? 1 : b.Fonction > a.Fonction ? -1 : 0
            )

            if (this.selectedCategory.getValue() !== 'tous') {
              let headerSum: { [key: string]: any } = new Object({})
              Object.keys(this.data[0]).map((key) => {
                const sum = sumBy(this.data, key)
                headerSum[key] =
                  typeof sum === 'string' || key === 'Numéro_A_JUST' ? '' : sum
                if (key === 'Fonction') headerSum[key] = 'SOMME'
              })
              this.data.push(headerSum)
            }

            const worksheet = xlsx.utils.json_to_sheet(this.data, {})
            const workbook = {
              Sheets: { data: worksheet },
              SheetNames: ['data'],
            }

            worksheet['!cols'] = this.autofitColumns(this.data)

            const excelBuffer: any = xlsx.write(workbook, {
              bookType: 'xlsx',
              type: 'array',
            })

            const filename = `Extraction-${
              this.userService.user.getValue()!.firstName
            }_du ${new Date(
              this.dateStart
                .getValue()
                .setMinutes(
                  this.dateStart.getValue().getMinutes() -
                    this.dateStart.getValue().getTimezoneOffset()
                )
            )
              .toJSON()
              .slice(0, 10)} au ${new Date(
              this.dateStop
                .getValue()
                .setMinutes(
                  this.dateStop.getValue().getMinutes() -
                    this.dateStop.getValue().getTimezoneOffset()
                )
            )
              .toJSON()
              .slice(0, 10)}_${this.userService.user.getValue()!
              .lastName!}_fait le ${new Date().toJSON().slice(0, 10)}`

            const data: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE })
            FileSaver.saveAs(data, filename + EXCEL_EXTENSION)
            this.loading.next(false)
          })
        })
      })
    })
  }

  sortByFCT(key1: any, key2: any): number {
    return +(key1.Fonction > key2.Fonction)
  }

  autofitColumns(json: any[]) {
    const jsonKeys = Object.keys(json[0])

    let objectMaxLength: any[] = []
    for (let i = 0; i < json.length; i++) {
      let value = json[i]
      for (let j = 0; j < jsonKeys.length; j++) {
        if (typeof value[jsonKeys[j]] == 'number') {
          objectMaxLength[j] = 10
        } else {
          const l = value[jsonKeys[j]] ? value[jsonKeys[j]].length : 0
          objectMaxLength[j] = objectMaxLength[j] >= l ? objectMaxLength[j] : l
        }
      }

      let key = jsonKeys
      for (let j = 0; j < key.length; j++) {
        objectMaxLength[j] =
          objectMaxLength[j] >= key[j].length
            ? objectMaxLength[j]
            : key[j].length + 1.5
      }
    }

    const wscols = objectMaxLength.map((w) => {
      return { width: w }
    })

    return wscols
  }

  getHRVentilation(
    hr: HumanResourceInterface,
    referentiel: ContentieuReferentielInterface,
    categories: HRCategoryInterface[]
  ) {
    const list: any = {}
    categories.map((c) => {
      list[c.id] = {
        etpt: 0,
        ...c,
      }
    })

    const now = new Date(this.dateStart.getValue().getTime())
    let nbDay = 0
    do {
      // only working day
      if (workingDay(now)) {
        nbDay++
        const { etp, situation } =
          this.humanResourceService.getEtpByDateAndPerson(
            referentiel.id,
            now,
            hr
          )

        if (etp !== null) {
          // @ts-ignore
          list[situation.category.id].etpt += etp
        }
      }
      now.setDate(now.getDate() + 1)
    } while (now.getTime() <= this.dateStop.getValue().getTime())

    // format render
    for (const property in list) {
      list[property].etpt = list[property].etpt / nbDay
    }

    return list
  }
}

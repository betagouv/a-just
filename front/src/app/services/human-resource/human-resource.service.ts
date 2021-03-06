import { Injectable } from '@angular/core'
import { maxBy, minBy, orderBy, sumBy, uniqBy } from 'lodash'
import { BehaviorSubject } from 'rxjs'
import { ActivityInterface } from 'src/app/interfaces/activity'
import { BackupInterface } from 'src/app/interfaces/backup'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import {
  HRCategoryInterface,
  HRCategorySelectedInterface,
} from 'src/app/interfaces/hr-category'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HRSituationInterface } from 'src/app/interfaces/hr-situation'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { getShortMonthString, today } from 'src/app/utils/dates'
import { ActivitiesService } from '../activities/activities.service'
import { ServerService } from '../http-server/server.service'

@Injectable({
  providedIn: 'root',
})
export class HumanResourceService {
  hr: BehaviorSubject<HumanResourceInterface[]> = new BehaviorSubject<
    HumanResourceInterface[]
  >([])
  contentieuxReferentiel: BehaviorSubject<ContentieuReferentielInterface[]> =
    new BehaviorSubject<ContentieuReferentielInterface[]>([])
  backups: BehaviorSubject<BackupInterface[]> = new BehaviorSubject<
    BackupInterface[]
  >([])
  backupId: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(
    null
  )
  hrIsModify: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  autoReloadData: boolean = true
  categories: BehaviorSubject<HRCategoryInterface[]> = new BehaviorSubject<
    HRCategoryInterface[]
  >([])
  fonctions: BehaviorSubject<HRFonctionInterface[]> = new BehaviorSubject<
    HRFonctionInterface[]
  >([])
  allContentieuxReferentiel: ContentieuReferentielInterface[] = []
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = []
  copyOfIdsIndispo: number[] = []
  categoriesFilterList: HRCategorySelectedInterface[] = []
  selectedReferentielIds: number[] = []

  constructor(
    private serverService: ServerService,
    private activitiesService: ActivitiesService
  ) {
    if (localStorage.getItem('backupId')) {
      const backupId = localStorage.getItem('backupId') || 0
      this.backupId.next(+backupId)
    }

    this.contentieuxReferentiel.subscribe((c) => {
      let list: ContentieuReferentielInterface[] = []
      c.map((cont) => {
        list.push(cont)
        list = list.concat(cont.childrens || [])
      })

      this.allContentieuxReferentiel = list
      this.selectedReferentielIds = c
        .filter((a) => this.copyOfIdsIndispo.indexOf(a.id) === -1)
        .map((r) => r.id)
    })
  }

  initDatas() {
    this.backupId.subscribe((id) => {
      if (this.autoReloadData) {
        this.getCurrentHR(id).then((result) => {
          localStorage.setItem('backupId', '' + result.backupId)
          this.categories.next(result.categories)
          this.categoriesFilterList = this.categories.getValue().map((c) => ({
            ...c,
            selected: true,
            label:
              c.label && c.label === 'Magistrat'
                ? 'Magistrat du si??ge'
                : c.label,
            labelPlural:
              c.label && c.label === 'Magistrat'
                ? 'Magistrats du si??ge'
                : `${c.label}s`,
            etpt: 0,
            nbPersonal: 0,
          }))
          this.fonctions.next(result.fonctions)
          this.activitiesService.activities.next(
            result.activities.map((a: ActivityInterface) => ({
              ...a,
              periode: new Date(a.periode),
            }))
          )

          this.activitiesService.hrBackupId = result.backupId
          this.hr.next(result.hr.map(this.formatHR))
          this.backups.next(
            result.backups.map((b: BackupInterface) => ({
              ...b,
              date: new Date(b.date),
            }))
          )
          this.autoReloadData = false
          this.backupId.next(result.backupId)
          this.hrIsModify.next(false)
        })
      } else {
        this.autoReloadData = true
      }
    })
  }

  formatHR(h: HumanResourceInterface) {
    return {
      ...h,
      dateStart: h.dateStart ? new Date(h.dateStart) : undefined,
      dateEnd: h.dateEnd ? new Date(h.dateEnd) : undefined,
      updatedAt: new Date(h.updatedAt),
    }
  }

  getCurrentHR(id: number | null) {
    return this.serverService
      .post('human-resources/get-current-hr', {
        backupId: id,
      })
      .then((r) => r.data)
  }

  async createHumanResource(date: Date) {
    const activities: RHActivityInterface[] = []
    const categories = this.categories.getValue()

    const hr = {
      id: this.hr.getValue().length * -1,
      firstName: 'Personne',
      lastName: 'XXX',
      activities,
      situations: [],
      indisponibilities: [],
      updatedAt: new Date(),
    }

    const newHR = await this.updateRemoteHR(hr)
    return newHR.id
  }

  deleteHRById(HRId: number) {
    const hr = this.hr.getValue()
    const index = hr.findIndex((h) => h.id === HRId)

    if (index !== -1) {
      hr.splice(index, 1)
      this.hr.next(hr)
    }
  }

  updateHR(list: HumanResourceInterface[], silentSave: boolean = false) {
    this.hr.next(list)
    this.hrIsModify.next(true)

    if (silentSave) {
      this.onSaveHRDatas(false, true)
    }
  }

  removeBackup() {
    if (confirm('??tes-vous s??r de vouloir supprimer cette sauvegarde?')) {
      return this.serverService
        .delete(`human-resources/remove-backup/${this.backupId.getValue()}`)
        .then(() => {
          this.backupId.next(null)
        })
    }

    return Promise.resolve()
  }

  duplicateBackup() {
    const backup = this.backups
      .getValue()
      .find((b) => b.id === this.backupId.getValue())

    const backupName = prompt('Sous quel nom ?', `${backup?.label} - copie`)
    if (backupName) {
      return this.serverService
        .post(`human-resources/duplicate-backup`, {
          backupId: this.backupId.getValue(),
          backupName,
        })
        .then((r) => {
          this.backupId.next(r.data)
        })
    }

    return Promise.resolve()
  }

  onSaveHRDatas(isCopy: boolean, silentSave: boolean = false) {
    let backupName = null
    if (isCopy) {
      backupName = prompt('Sous quel nom ?')
    }

    return this.serverService
      .post(`human-resources/save-backup`, {
        hrList: this.hr.getValue(),
        backupId: this.backupId.getValue(),
        backupName: backupName ? backupName : null,
      })
      .then((r) => {
        this.hrIsModify.next(false)

        if (!silentSave) {
          alert('Enregistrement OK !')
          this.backupId.next(r.data)
        }
      })
  }

  async removeHrById(id: number) {
    if (confirm('Supprimer cette personne ?')) {
      return this.serverService
        .delete(`human-resources/remove-hr/${id}`)
        .then(() => {
          const list = this.hr.getValue()
          const findIndex = list.findIndex((r) => r.id === id)
          if (findIndex !== -1) {
            list.splice(findIndex, 1)
            this.hr.next(list)

            // update date of backup after remove
            const hrBackups = this.backups.getValue()
            const backupIndex = hrBackups.findIndex(
              (b) => b.id === this.backupId.getValue()
            )
            if (backupIndex !== -1) {
              hrBackups[backupIndex].date = new Date()
              this.backups.next(hrBackups)
            }
            return true
          } else {
            return false
          }
        })
    }

    return false
  }

  createEmpyHR() {
    let backupName = prompt('Sous quel nom ?')

    if (backupName) {
      return this.serverService
        .post(`human-resources/save-backup`, {
          hrList: [],
          backupName: backupName,
        })
        .then((r) => {
          this.backupId.next(r.data)
        })
    }

    return Promise.resolve()
  }

  duplicateHR(rhId: number) {
    if (confirm('Dupliquer cette personne ?')) {
      const list = this.hr.getValue()
      const findIndex = list.findIndex((r) => r.id === rhId)
      if (findIndex !== -1) {
        const person = JSON.parse(JSON.stringify(list[findIndex]))
        person.id = list.length * -1
        list.push(person)
        this.hr.next(list)
        this.hrIsModify.next(true)
        return true
      }
    }

    return false
  }

  filterActivitiesByDate(
    list: RHActivityInterface[],
    date: Date
  ): RHActivityInterface[] {
    list = orderBy(list || [], ['dateStart'], ['desc'])
    list = list.filter((a: any) => {
      const dateStop = a.dateStop ? today(a.dateStop) : null
      const dateStart = a.dateStart ? today(a.dateStart) : null

      return (
        (dateStart === null && dateStop === null) ||
        (dateStart &&
          dateStart.getTime() <= date.getTime() &&
          dateStop === null) ||
        (dateStart === null &&
          dateStop &&
          dateStop.getTime() >= date.getTime()) ||
        (dateStart &&
          dateStart.getTime() <= date.getTime() &&
          dateStop &&
          dateStop.getTime() >= date.getTime())
      )
    })

    return uniqBy(list, 'referentielId')
  }

  distinctSituations(situations: HRSituationInterface[]) {
    const listTimeTamps: number[] = []

    return situations.reduce(
      (
        previousValue: HRSituationInterface[],
        currentValue: HRSituationInterface
      ) => {
        const d = today(currentValue.dateStart)
        const getTime = d.getTime()
        if (listTimeTamps.indexOf(getTime) === -1) {
          listTimeTamps.push(getTime)
          previousValue.push(currentValue)
        }

        return previousValue
      },
      []
    )
  }

  findSituation(hr: HumanResourceInterface | null, date?: Date, order = 'desc') {
    if (date) {
      date = today(date)
    }

    if (hr?.dateEnd && date) {
      // control de date when the person goone
      const dateEnd = today(hr.dateEnd)
      if (dateEnd.getTime() < date.getTime()) {
        return {
          id: 0,
          etp: 0,
          category: null,
          fonction: null,
          dateStart: dateEnd,
          activities: [],
        }
      }
    }
    let situations = this.findAllSituations(hr, date, order)
    return situations.length ? situations[0] : null
  }

  findAllSituations(hr: HumanResourceInterface | null, date?: Date, order: string | boolean = 'desc') {
    let situations = orderBy(
      hr?.situations || [],
      [
        function (o: HRSituationInterface) {
          const date = new Date(o.dateStart)
          return date.getTime()
        },
      ],
      // @ts-ignore
      [order]
    )

    if (date) {
      situations = situations.filter((hra) => {
        const dateStart = today(hra.dateStart)
        return dateStart.getTime() <= date.getTime()
      })
    }

    return situations
  }

  findAllIndisponibilities(hr: HumanResourceInterface | null, date?: Date) {
    let indisponibilities = orderBy(
      hr?.indisponibilities || [],
      [
        function (o: RHActivityInterface) {
          const date = o.dateStart ? new Date(o.dateStart) : new Date()
          return date.getTime()
        },
      ],
      ['desc']
    )

    if (date) {
      date = today(date)
      indisponibilities = indisponibilities.filter((hra) => {
        const dateStart = today(hra.dateStart)

        if (date && dateStart.getTime() <= date.getTime()) {
          if (hra.dateStop) {
            const dateStop = today(hra.dateStop)
            if (dateStop.getTime() >= date.getTime()) {
              return true
            }
          } else {
            // return true if they are no end date
            return true
          }
        }

        return false
      })
    }

    return indisponibilities
  }

  async updatePersonById(humanId: number, params: Object) {
    const list = this.hr.getValue()
    const index = list.findIndex((h) => h.id === humanId)

    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...params,
      }

      console.log(list[index])

      await this.updateRemoteHR(list[index])
      return true
    }

    return false
  }

  async pushHRUpdate(
    humanId: number,
    profil: any,
    newReferentiel: ContentieuReferentielInterface[],
    indisponibilities: RHActivityInterface[]
  ) {
    const list = this.hr.getValue()
    const index = list.findIndex((h) => h.id === humanId)
    const categories = this.categories.getValue()
    const fonctions = this.fonctions.getValue()

    if (index !== -1) {
      const activitiesStartDate = today(profil.activitiesStartDate)

      // update situation
      let situations = list[index].situations || []
      const cat = categories.find((c) => c.id == profil.categoryId)
      const fonct = fonctions.find((c) => c.id == profil.fonctionId)
      if (!fonct) {
        alert('Vous devez saisir une fonction !')
        return
      }

      if (!cat) {
        alert('Vous devez saisir une cat??gorie !')
        return
      }

      const activities: any[] = []
      newReferentiel
        .filter((r) => r.percent && r.percent > 0)
        .map((r) => {
          activities.push({
            percent: r.percent || 0,
            contentieux: r,
          })
          ;(r.childrens || [])
            .filter((r) => r.percent && r.percent > 0)
            .map((child) => {
              activities.push({
                percent: child.percent || 0,
                contentieux: child,
              })
            })
        })

      // find if situation is in same date
      const isSameDate = situations.findIndex((s) => {
        const day = today(s.dateStart)
        return activitiesStartDate.getTime() === day.getTime()
      })

      if (isSameDate !== -1) {
        situations[isSameDate] = {
          ...situations[isSameDate],
          etp: profil.etp / 100,
          category: cat,
          fonction: fonct,
          activities,
        }
      } else {
        situations.splice(0, 0, {
          id: -1,
          etp: profil.etp / 100,
          category: cat,
          fonction: fonct,
          dateStart: activitiesStartDate,
          activities,
        })
      }

      list[index] = {
        ...list[index],
        firstName: profil.firstName,
        lastName: profil.lastName,
        dateStart: profil.dateStart ? new Date(profil.dateStart) : undefined,
        dateEnd: profil.dateEnd ? new Date(profil.dateEnd) : undefined,
        situations: this.distinctSituations(situations),
        indisponibilities,
      }

      await this.updateRemoteHR(list[index])
      return true
    }

    return false
  }

  updateRemoteHR(hr: any) {
    return this.serverService
      .post(`human-resources/update-hr`, {
        hr,
        backupId: this.backupId.getValue(),
      })
      .then((response) => {
        const newHR = this.formatHR(response.data)
        const list = this.hr.getValue()
        const index = list.findIndex((l) => l.id === newHR.id)

        if (index === -1) {
          list.push(newHR)
        } else {
          list[index] = newHR
        }

        this.hr.next(list)

        const hrBackups = this.backups.getValue()
        const backupIndex = hrBackups.findIndex(
          (b) => b.id === this.backupId.getValue()
        )
        if (backupIndex !== -1) {
          hrBackups[backupIndex].date = newHR.updatedAt
          this.backups.next(hrBackups)
        }

        return newHR
      })
  }

  removeSituation(situationId: number) {
    if (confirm('Supprimer cette situation ?')) {
      return this.serverService
        .delete(`human-resources/remove-situation/${situationId}`)
        .then((data) => {
          const hr = data.data
          const list = this.hr.getValue()
          const findIndex = list.findIndex((r) => r.id === hr.id)
          if (findIndex !== -1) {
            list[findIndex] = this.formatHR(hr)
            this.hr.next(list)

            // update date of backup after remove
            const hrBackups = this.backups.getValue()
            const backupIndex = hrBackups.findIndex(
              (b) => b.id === this.backupId.getValue()
            )
            if (backupIndex !== -1) {
              hrBackups[backupIndex].date = new Date()
              this.backups.next(hrBackups)
            }
            return true
          } else {
            return false
          }
        })
    }

    return false
  }

  getEtpByDateAndPerson(
    referentielId: number,
    date: Date,
    hr: HumanResourceInterface
  ) {
    const situation = this.findSituation(hr, date)

    if (situation && situation.category && situation.category.id) {
      const activitiesFiltred = (situation.activities || []).filter(
        (a) => a.contentieux && a.contentieux.id === referentielId
      )
      const indispoFiltred = this.findAllIndisponibilities(hr, date)
      let reelEtp = situation.etp - sumBy(indispoFiltred, 'percent') / 100
      if (reelEtp < 0) {
        reelEtp = 0
      }

      return {
        etp: (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100,
        situation,
      }
    }

    return {
      etp: null,
      situation: null,
    }
  }

  controlIndisponibilities(
    human: HumanResourceInterface,
    indisponibilities: RHActivityInterface[]
  ) {
    let listAllDates: Date[] = []
    listAllDates = listAllDates.concat(
      indisponibilities
        .filter((i) => i.dateStart)
        .map((s) => today(s.dateStart))
    )
    listAllDates = listAllDates.concat(
      indisponibilities
        .filter((i) => i.dateStop)
        .map((s) => today(s.dateStop))
    )
    const minDate = minBy(listAllDates, (d) => d.getTime())
    let maxDate = maxBy(listAllDates, (d) => d.getTime())

    if (!minDate || !maxDate) {
      return null
    }

    const currentDate = new Date(minDate)
    let idOfIndisponibilities: number[] = []
    let errorsList = []
    while (currentDate.getTime() <= maxDate.getTime()) {
      const findedIndispo = human
        ? this.findAllIndisponibilities(
            { ...human, indisponibilities },
            currentDate
          )
        : []

      if (
        JSON.stringify(idOfIndisponibilities) !==
        JSON.stringify(findedIndispo.map((f) => f.id))
      ) {
        idOfIndisponibilities = findedIndispo.map((f) => f.id)

        const totalPercent = sumBy(findedIndispo, 'percent')
        if (totalPercent > 100) {
          errorsList.push({
            date: new Date(currentDate),
            percent: totalPercent,
          })
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return errorsList.length
      ? errorsList
          .map(
            (r) =>
              `Le ${(r.date.getDate() + '').padStart(
                2,
                '0'
              )} ${getShortMonthString(
                r.date
              )} ${r.date.getFullYear()} vous seriez ?? ${
                r.percent
              }% d'indisponibilit??.`
          )
          .join(', ')
      : null
  }
}

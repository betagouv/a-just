import { Injectable } from '@angular/core'
import { maxBy, minBy, orderBy, sumBy, uniqBy } from 'lodash'
import { BehaviorSubject } from 'rxjs'
import { BackupInterface } from 'src/app/interfaces/backup'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
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
  >([]) // TODO REMOVE
  contentieuxReferentiel: BehaviorSubject<ContentieuReferentielInterface[]> =
    new BehaviorSubject<ContentieuReferentielInterface[]>([])
    contentieuxReferentielOnly: BehaviorSubject<ContentieuReferentielInterface[]> =
    new BehaviorSubject<ContentieuReferentielInterface[]>([])
  backups: BehaviorSubject<BackupInterface[]> = new BehaviorSubject<
    BackupInterface[]
  >([])
  backupId: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(
    null
  )
  hrBackup: BehaviorSubject<BackupInterface | null> =
    new BehaviorSubject<BackupInterface | null>(null)
  hrIsModify: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  categories: BehaviorSubject<HRCategoryInterface[]> = new BehaviorSubject<
    HRCategoryInterface[]
  >([])
  fonctions: BehaviorSubject<HRFonctionInterface[]> = new BehaviorSubject<
    HRFonctionInterface[]
  >([])
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = []
  allIndisponibilityReferentielIds: Array<number> = []
  copyOfIdsIndispo: number[] = []
  categoriesFilterListIds: number[] = []
  selectedReferentielIds: number[] = []
  selectedCategoriesIds: number[] = []

  constructor(
    private serverService: ServerService,
    private activitiesService: ActivitiesService
  ) {
    if (localStorage.getItem('backupId')) {
      const backupId = localStorage.getItem('backupId') || 0
      this.backupId.next(+backupId)
    }

    this.backupId.subscribe((id) => {
      this.activitiesService.hrBackupId = id

      if (id) {
        localStorage.setItem('backupId', '' + id)
      }

      const bk: BackupInterface | undefined = this.backups
        .getValue()
        .find((b) => b.id === id)
      this.hrBackup.next(bk || null)
    })

    this.backups.subscribe((list) => {
      if (list.length && !list.find((b) => b.id === this.backupId.getValue())) {
        this.backupId.next(list[0].id)
      }

      const bk: BackupInterface | undefined = list.find(
        (b) => b.id === this.backupId.getValue()
      )
      this.hrBackup.next(bk || null)
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

    const hr = {
      id: this.hr.getValue().length * -1,
      firstName: null,
      lastName: null,
      activities,
      situations: [],
      indisponibilities: [],
      updatedAt: new Date(),
    }

    //if (hr.firstName !== 'Prénom' && hr.lastName !== 'Nom') {
    const newHR = await this.updateRemoteHR(hr)
    return newHR.id
    return hr.id
    //} else return null
  }

  deleteHRById(HRId: number) {
    const hr = this.hr.getValue()
    const index = hr.findIndex((h) => h.id === HRId)

    if (index !== -1) {
      hr.splice(index, 1)
      this.hr.next(hr)
    }
  }

  removeBackup() {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde?')) {
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

  async removeHrById(id: number) {
    if (confirm('Supprimer cette personne ?')) {
      return this.serverService
        .delete(`human-resources/remove-hr/${id}`)
        .then(() => {
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

  findSituation(
    hr: HumanResourceInterface | null,

    date?: Date,

    order = 'desc'
  ) {
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

  findAllSituations(
    hr: HumanResourceInterface | null,

    date?: Date,

    order: string | boolean = 'desc'
  ) {
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

  async updatePersonById(
    orignalObject: HumanResourceInterface,
    params: Object
  ): Promise<HumanResourceInterface | null> {
    orignalObject = {
      ...orignalObject,
      ...params,
    }

    return await this.updateRemoteHR(orignalObject)
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
        alert('Vous devez saisir une catégorie !')
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
        .then((response) => {
          const newHR = this.formatHR(response.data)

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
      let reelEtp = 0
      const isIndispoRef =
        this.allIndisponibilityReferentielIds.includes(referentielId)
      if (isIndispoRef) {
        reelEtp = situation.etp
      } else {
        reelEtp = 0
        const isIndispoRef =
          this.allIndisponibilityReferentielIds.includes(referentielId)
        if (isIndispoRef) {
          reelEtp = situation.etp
        } else {
          reelEtp = situation.etp - sumBy(indispoFiltred, 'percent') / 100
        }
      }
      if (reelEtp < 0) {
        reelEtp = 0
      }
      return {
        etp: (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100,
        situation,
        indisponibilities: indispoFiltred,
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
      indisponibilities.filter((i) => i.dateStop).map((s) => today(s.dateStop))
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
              )} ${r.date.getFullYear()} vous seriez à ${
                r.percent
              }% d'indisponibilité.`
          )
          .join(', ')
      : null
  }

  onFilterList(
    backupId: number,
    date: Date,
    contentieuxIds: number[] | null,
    categoriesIds: number[],
    endPeriodToCheck?: Date,
    extractor?: boolean
  ) {
    console.log('extra', extractor ? extractor : false)

    return this.serverService
      .post(`human-resources/filter-list`, {
        backupId,
        date,
        contentieuxIds,
        categoriesIds,
        extractor: extractor ? extractor : false,
        endPeriodToCheck,
      })
      .then((data) => {
        return data.data.list
      })
  }

  loadRemoteHR(hrId: number): Promise<HumanResourceInterface | null> {
    return this.serverService
      .get(`human-resources/read-hr/${hrId}`)
      .then((response) => this.formatHR(response.data))
  }
}

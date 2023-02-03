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

/**
 * Service de récupération des fiches +
 */

@Injectable({
  providedIn: 'root',
})
export class HumanResourceService {
  /**
   * Liste des contentieux + soutien + indispo
   */
  contentieuxReferentiel: BehaviorSubject<ContentieuReferentielInterface[]> =
    new BehaviorSubject<ContentieuReferentielInterface[]>([])
  /**
   * Liste des contentieux uniquement
   */
  contentieuxReferentielOnly: BehaviorSubject<
    ContentieuReferentielInterface[]
  > = new BehaviorSubject<ContentieuReferentielInterface[]>([])
  /**
   * Liste des juridictions dont à accès l'utilisateur
   */
  backups: BehaviorSubject<BackupInterface[]> = new BehaviorSubject<
    BackupInterface[]
  >([])
  /**
   * Id de la juridiction selectionnée
   */
  backupId: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(
    null
  )
  /**
   * Juridiction selectionnée
   */
  hrBackup: BehaviorSubject<BackupInterface | null> =
    new BehaviorSubject<BackupInterface | null>(null)
  /**
   * Liste des catégories
   */
  categories: BehaviorSubject<HRCategoryInterface[]> = new BehaviorSubject<
    HRCategoryInterface[]
  >([])
  /**
   * Liste des fonctions
   */
  fonctions: BehaviorSubject<HRFonctionInterface[]> = new BehaviorSubject<
    HRFonctionInterface[]
  >([])
  /**
   * Liste du référentiels des indispos
   */
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = []
  /**
   * Liste des id du référentiels des indispos
   */
  allIndisponibilityReferentielIds: Array<number> = []
  /**
   * Liste des catégories sélectionnée dans l'écran du ventilateur en cache
   */
  categoriesFilterListIds: number[] = []
  /**
   * Liste des référentiels sélectionnée dans l'écran du ventilateur en cache
   */
  selectedReferentielIds: number[] = []

  /**
   * Constructeur qui lance le chargement d'une juridiction au chargement de la page
   * @param serverService
   * @param activitiesService
   */
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

  /**
   * Pour transformer les dates en vrais objets date
   * @param h
   * @returns
   */
  formatHR(h: HumanResourceInterface) {
    return {
      ...h,
      dateStart: h.dateStart ? new Date(h.dateStart) : undefined,
      dateEnd: h.dateEnd ? new Date(h.dateEnd) : undefined,
      updatedAt: new Date(h.updatedAt),
    }
  }

  /**
   * Liste des fiches d'une juridiction
   * @param id
   * @returns
   */
  getCurrentHR(id: number | null) {
    return this.serverService
      .post('human-resources/get-current-hr', {
        backupId: id,
      })
      .then((r) => r.data)
  }

  /**
   * Création d'une fiche vide
   * @param date
   * @returns
   */
  async createHumanResource(date: Date) {
    const activities: RHActivityInterface[] = []

    const hr = {
      id: -1,
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

  /**
   * Suppression d'un jeu de donnée d'une juridiction
   * @returns
   */
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

  /**
   * Dupplication d'une juridiciton
   * @returns
   */
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

  /**
   * Suppression d'une fiche d'une juridiction
   * @param id
   * @returns
   */
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

  /**
   * Création d'une juridiction vide
   * @returns
   */
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

  /**
   * Filtre des activités saisies à une date précise
   * @param list
   * @param date
   * @returns
   */
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

  /**
   * Suppression des doublons de situations
   * @param situations
   * @returns
   */
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

  /**
   * Filtre d'une situation d'une fiche à une date précise
   * @param hr
   * @param date
   * @param order
   * @returns
   */
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

  /**
   * Liste de toutes les situations jusqu'à une date saisie
   * @param hr 
   * @param date 
   * @param order 
   * @returns 
   */
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

  /**
   * Filtre des indispos d'une fiche
   * @param hr 
   * @param date 
   * @returns 
   */
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

  /**
   * Mise à jour d'une fiche avec son ID et sur le serveur
   * @param orignalObject 
   * @param params 
   * @returns 
   */
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

  /**
   * API mise à jour d'une fiche sur le serveur
   * @param hr 
   * @returns 
   */
  updateRemoteHR(hr: any) {
    console.log(hr)
    return this.serverService
      .post(`human-resources/update-hr`, {
        hr,
        backupId: this.backupId.getValue(),
      })
      .then((response) => {
        console.log(response)

        const newHR = this.formatHR(response.data)
        console.log(response.data)

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

  /**
   * API Suppression d'une situation d'une fiche
   * @param situationId 
   * @returns 
   */
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

  /**
   * Calcul de l'ETP à une date d'une fiche (etp - indispos)
   * @param referentielId 
   * @param date 
   * @param hr 
   * @returns 
   */
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

  /**
   * Control de l'ensemble des indispo qu'il n'y ai pas plus de 100% à une date donnée
   * @param human 
   * @param indisponibilities 
   * @returns 
   */
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

  /**
   * API appel au serveur pour lister les effectifs d'une juridiction à une date précise
   * @param backupId 
   * @param date 
   * @param contentieuxIds 
   * @param categoriesIds 
   * @param endPeriodToCheck 
   * @param extractor 
   * @returns 
   */
  onFilterList(
    backupId: number,
    date: Date,
    contentieuxIds: number[] | null,
    categoriesIds: number[],
    endPeriodToCheck?: Date,
    extractor?: boolean
  ) {
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
        console.log(data.data)

        return data.data
      })
  }

  /**
   * API appel au serveur pour retourner les détails d'une fiche
   * @param hrId 
   * @returns 
   */
  loadRemoteHR(hrId: number): Promise<HumanResourceInterface | null> {
    return this.serverService
      .get(`human-resources/read-hr/${hrId}`)
      .then((response) => this.formatHR(response.data))
  }
}

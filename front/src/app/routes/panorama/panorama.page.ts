import { Component, OnDestroy, OnInit } from '@angular/core'
import { BackupInterface } from 'src/app/interfaces/backup'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { UserService } from 'src/app/services/user/user.service'
import {
  userCanViewContractuel,
  userCanViewGreffier,
  userCanViewMagistrat,
} from 'src/app/utils/user'
import { today, dateAddDays } from 'src/app/utils/dates'
import { HRCategorySelectedInterface, } from 'src/app/interfaces/hr-category'
import { listFormatedInterface, HumanResourceSelectedInterface } from '../workforce/workforce.page'
import { sumBy } from 'lodash'

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  templateUrl: './panorama.page.html',
  styleUrls: ['./panorama.page.scss'],
})
export class PanoramaPage extends MainClass implements OnInit, OnDestroy {
  /**
 * Date selected
 */
  dateSelected: Date = new Date()
  /**
   * Date de fin de requête
   */
  dateStart: Date = dateAddDays(new Date(), -15)
  /**
  * Date de début de requête
  */
  dateEnd: Date = dateAddDays(new Date(), +15)
  /**
   * Date de début de requête
   */
  now: Date = new Date()
  /**
   * liste première requête
   */
  firstList: listFormatedInterface[] = []
  /**
  * Liste seconde requête
  */
  secondList: listFormatedInterface[] = []
  /**
   * Peux voir l'interface magistrat
   */
  canViewMagistrat: boolean = false
  /**
   * Peux voir l'interface greffier
   */
  canViewGreffier: boolean = false
  /**
   * Peux voir l'interface contractuel
   */
  canViewContractuel: boolean = false
  /**
   * Peux voir la partie ventilation
   */
  canViewVentilation: boolean = false
  /**
   * Peux voir la partie activities
   */
  canViewActivities: boolean = false
  /**
  * En cours de chargement
  */
  isLoading: boolean = false
  /**
* liste des catégories filtrées
*/
  categoriesFilterList: HRCategorySelectedInterface[] = []
  /**
   * Liste des ids catégories
   */
  categoriesFilterListIds: number[] = []
  /**
   * Identifiants des contentieux selectionnés
   */
  selectedReferentielIds: number[] = []
  /**
   * Liste formatée contenant l'ensemble des informations nécessaire au chargement de la page
   */
  listFormated: listFormatedInterface[] = []
  /**
   *  Liste des personnes ayant une date de départ dans les 15 prochains jours ou les 15 derniers jours
   */
  listDepartures: HumanResourceSelectedInterface[] = []
  /**
   *  Liste des personnes ayant une date de début dans les 15 prochains jours ou les 15 derniers jours
   */
  listArrivals: HumanResourceSelectedInterface[] = []
  /**
   * Liste des personnes non disponibles dans les 15 prochains jours ou les 15 derniers jours
   */
  listUnavailabilities: HumanResourceSelectedInterface[] = []
  /**
   * Total des effectifs à afficher
   */
  totalWorkforce: number = 0

  /**
   * Constructor
   */
  constructor(private userService: UserService, public humanResourceService: HumanResourceService) {
    super()
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnInit() {
    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)
        this.canViewVentilation = this.userService.canViewVentilation()
        this.canViewActivities = this.userService.canViewActivities()
      })
    )

    this.watch(
      this.humanResourceService.hrBackup.subscribe((hrBackup: BackupInterface | null) => {
        this.onFilterList(hrBackup)
      })
    )
  }

  /**
   * Filtre liste RH
   */
  onFilterList(backup: BackupInterface | null = null) {
    if (!backup) {
      return
    }

    this.isLoading = true

    this.humanResourceService
      .onFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        this.dateStart,
        null,
        this.humanResourceService.categoriesFilterListIds,
        this.dateEnd
      )
      .then(({ list }) => {
        this.listFormated = list
        console.log("ListFormated:", list)

        let hrList: HumanResourceSelectedInterface[] = []

        list.map((group: any) => {
          hrList = hrList.concat(group.hr || [])

          const contentieux = this.humanResourceService.contentieuxReferentielOnly.getValue().map(contentieux => contentieux.id)

          hrList.map(hr => {
            const activityPercent = sumBy((hr.currentActivities || []).filter(c => contentieux.includes(c.contentieux.id)), 'percent')

            hr.totalAffected = activityPercent
            hr.currentActivities = (hr.currentActivities || []).filter(c => contentieux.includes(c.contentieux.id))
          })

          let fifteenDaysLater = today(this.dateSelected)
          fifteenDaysLater.setDate(fifteenDaysLater.getDate() + 15)
          let fifteenDaysBefore = today(this.dateSelected)
          fifteenDaysBefore.setDate(fifteenDaysBefore.getDate() - 15)
          for (let i = 0; i < hrList.length; i++) {
            const hr = hrList[i]

            // Indisponibilité
            if (hr.indisponibilities.length > 0) {
              const list = hr.indisponibilities.filter(elem =>
                today(elem.dateStart).getTime() >= fifteenDaysBefore.getTime() && today(elem.dateStart).getTime() <= fifteenDaysLater.getTime()
              )
              if (list.length && !this.listUnavailabilities.includes(hr)) {
                this.listUnavailabilities.push(hr)
              }

            }

            // Arrivé
            if (hr.dateStart) {
              if (hr.id === 10171) {
                console.log("hr 10171:", hr.dateStart)
              }
              if (today(hr.dateStart).getTime() >= fifteenDaysBefore.getTime() && today(hr.dateStart).getTime() <= fifteenDaysLater.getTime()) {
                if (!this.listArrivals.includes(hr)) {
                  this.listArrivals.push(hr)
                }
              }
              hr.dateStart = today(hr.dateStart)
            }

            //Départ
            if (hr.dateEnd) {
              if (today(hr.dateEnd).getTime() >= fifteenDaysBefore.getTime() && today(hr.dateEnd).getTime() <= fifteenDaysLater.getTime()) {
                if (!this.listDepartures.includes(hr)) {
                  this.listDepartures.push(hr)
                }
              }
              hr.dateEnd = today(hr.dateEnd)
            }
          }
        })
        console.log('Departures:', this.listDepartures)
        console.log('Arrivés:', this.listArrivals)
        console.log('Indispos:', this.listUnavailabilities)
        this.totalWorkforce = this.listDepartures.length + this.listArrivals.length + this.listUnavailabilities.length
        this.isLoading = false
      })
  }

  /**
   * Récuperer le type de l'app
   */
  getInterfaceType() {
    return this.userService.interfaceType === 0 ? 'tribunal judiciaire' : 'cours d\'appel'
  }
  /**
   * Destruction du composant
   */
  ngOnDestroy() {
    this.watcherDestroy();
  }
}


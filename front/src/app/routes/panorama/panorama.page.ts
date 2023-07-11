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
import { today } from 'src/app/utils/dates'
import { HRCategorySelectedInterface, } from 'src/app/interfaces/hr-category'
import { listFormatedInterface, HumanResourceIsInInterface, HumanResourceSelectedInterface } from '../workforce/workforce.page'
import { sumBy } from 'lodash'
import { fixDecimal } from 'src/app/utils/numbers'

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
   * Date de fin de situation
   */
  dateEnd: Date = new Date()
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
   * Liste de toutes les personnes quelque soit l'arrivée ou le départ
   */
  allPersons: HumanResourceIsInInterface[] = []
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
  listUnavailabilities :  HumanResourceSelectedInterface[] = []


  workforce : HRCategorySelectedInterface[] = [
    {
      id: 1,
      label: "Siège",
      textColor: '#000091',
      bgColor: '#e3e3fd',
      hoverColor: 'blue',
      selected: true,
      etpt: 0,
      nbPersonal: 0,
      labelPlural: "",
      headerLabel: 'Siège',
      percentAllocated: 0,
      lastUpdate: today(),
      poste: [ {
        name: 'titulaires',
        selected: true,
        etpt: 0,
        nbPersonal: 0,
      }, {
        name: 'placés',
        selected: true,
        etpt: 0,
        nbPersonal: 0,
      },  {
        name: 'contractuels',
        selected: true,
        etpt: 0,
        nbPersonal: 0,
      }],
    },
    {
      id: 2,
      label: "Greffe",
      textColor: '#a558a0',
      bgColor: '#fee7fc',
      hoverColor: 'purple',
      selected: true,
      etpt: 0,
      nbPersonal: 0,
      labelPlural: "",
      headerLabel: 'Greffe',
      percentAllocated: 0,
      lastUpdate: today(),
      poste: [ {
        name: 'titulaires',
        selected: true,
        etpt: 0,
        nbPersonal: 0,
      }, {
        name: 'placés',
        selected: true,
        etpt: 0,
        nbPersonal: 0,
      },  {
        name: 'contractuels',
        selected: true,
        etpt: 0,
        nbPersonal: 0,
      }],
    },
    {
      id: 3,
      label: "Autour du magistrat",
      textColor: '#796830',
      bgColor: '#fef6e3',
      hoverColor: 'yellow',
      selected: true,
      etpt: 0,
      nbPersonal: 0,
      labelPlural: "",
      headerLabel: 'Autour du magistrat',
      percentAllocated: 0,
      lastUpdate: today(),
      poste: [ ],
    }
  ]

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
    if(!backup) {
      return
    }

    this.isLoading = true
    this.humanResourceService
      .onFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        this.dateSelected,
        null,
        this.humanResourceService.categoriesFilterListIds,
      )
      .then(({ list, allPersons }) => {
        console.log('[panorama.page.ts][line 216] list:\n', list)

        let hrList: HumanResourceSelectedInterface[] = []

        list.map((group: any) => {
          let elem = null

          switch (group.label) {
            case 'Magistrats du siège':
                elem = this.workforce.find(elem => elem.label === "Siège")
                if (elem) {
                  elem.nbPersonal = group.hr.length
                  elem.lastUpdate = new Date(Math.max(...group.hr.map((hr : HumanResourceSelectedInterface) => new Date(hr.updatedAt))))
                }
                break;
            case 'Greffe':
                elem = this.workforce.find(elem => elem.label === "Greffe")
                if (elem) {
                  elem.nbPersonal = group.hr.length
                  elem.lastUpdate = new Date(Math.max(...group.hr.map((hr : HumanResourceSelectedInterface) => new Date(hr.updatedAt))))
                }
                break;
            case'Autour du magistrat':
                elem = this.workforce.find(elem => elem.label === "Autour du magistrat")
                if (elem) {
                  elem.nbPersonal = group.hr.length
                  elem.lastUpdate = new Date(Math.max(...group.hr.map((hr : HumanResourceSelectedInterface) => new Date(hr.updatedAt))))
                }
                break;
          }

          hrList = hrList.concat(group.hr || [])

          const contentieux = this.humanResourceService.contentieuxReferentielOnly.getValue().map(contentieux => contentieux.id)

          hrList.map(hr => {
            const etp = hr.etp
            const activityPercent = sumBy((hr.currentActivities || []).filter(c => contentieux.includes(c.contentieux.id)), 'percent') 
            const indispo = hr.hasIndisponibility

            let hrEtp = etp * activityPercent - indispo
            hr.totalAffected = activityPercent
            hr.currentActivities = (hr.currentActivities || []).filter(c => contentieux.includes(c.contentieux.id))
            if (hrEtp < 0)
              hrEtp = 0
            
            let elem = null
            const postLabel = hr.fonction?.position.toLocaleLowerCase()

            switch (hr.category?.label) {
              case 'Magistrat':
                  elem = this.workforce.find(elem => elem.label === "Siège")
                  if (elem) { 
                     elem.etpt += hr.etp 
                     let poste = elem.poste.find(poste =>  poste.name.slice(0, poste.name.length - 1).toLocaleLowerCase() === postLabel)
                     poste ? poste.nbPersonal += 1 : null
                  }
                  break;
              case 'Greffe':
                  elem = this.workforce.find(elem => elem.label === "Greffe")
                  if (elem) {
                    elem.etpt += hr.etp
                    let poste = elem.poste.find(poste =>  poste.name.slice(0, poste.name.length - 1).toLocaleLowerCase() === postLabel)
                    poste ? poste.nbPersonal += 1 : null
                  }
                  break;
              case'Autour du magistrat':
                  elem = this.workforce.find(elem => elem.label === "Autour du magistrat")
                  if (elem) {
                    elem.etpt += hr.etp
                    let poste = elem.poste.find(poste =>  poste.name.slice(0, poste.name.length - 1).toLocaleLowerCase() === postLabel)
                    poste ? poste.nbPersonal += 1 : null
                  }
                  break;
            }
          })

          this.workforce.map(elem => elem.etpt = fixDecimal(elem.etpt))

          let fifteenDaysLater = today(this.dateSelected)
          fifteenDaysLater.setDate(fifteenDaysLater.getDate() + 15)
          let fifteenDaysBefore = today(this.dateSelected)
          fifteenDaysBefore.setDate(fifteenDaysBefore.getDate() - 15)
          for (let i = 0; i < hrList.length ; i++) {
            const hr = hrList[i]

            // Indisponibilité
            if (hr.indisponibilities.length > 0) {
              const list = hr.indisponibilities.filter(elem => 
                today(elem.dateStart).getTime() >=  fifteenDaysBefore.getTime() && today(elem.dateStart).getTime() <=  fifteenDaysLater.getTime()
              )
              if (list.length > 0 && !this.listUnavailabilities.includes(hr)){
                hr.indisponibilities.map(indispo => indispo.dateStart = today(indispo.dateStart))
                hr.indisponibilities.map(indispo => indispo.dateStop = today(indispo.dateStop))
                this.listUnavailabilities.push(hr)
              }
            }

            // Arrivé
            const futureSituation = this.humanResourceService.findAllSituations(hr, this.dateSelected, 'desc', true)
            if(futureSituation.some(situation => today(situation.dateStart).getTime() <= fifteenDaysLater.getTime())) {
              if (!this.listArrivals.includes(hr)){
                hr.situations.map(situation => situation.dateStart = today(situation.dateStart))
                this.listArrivals.push(hr)
              }
            }
            const pastSituation = this.humanResourceService.findAllSituations(hr, this.dateSelected, 'desc', false)
            if(pastSituation.some(situation =>  today(situation.dateStart).getTime() >= fifteenDaysBefore.getTime())) {
              if (!this.listArrivals.includes(hr)) {
                hr.situations.map(situation => situation.dateStart = today(situation.dateStart))
                this.listArrivals.push(hr)
              }
            }


            //Départ
            if (hr.dateEnd) {
              if (today(hr.dateEnd).getTime() >=  fifteenDaysBefore.getTime() && today(hr.dateEnd).getTime() <=  fifteenDaysLater.getTime()) {
                if (!this.listDepartures.includes(hr)){
                  this.listDepartures.push(hr)
                }
              }
              hr.dateEnd = today(hr.dateEnd)
            }
            hr.dateStart = today(hr.dateStart)
          }
        })
        console.log('listUnavailabilities:', this.listUnavailabilities)
      this.isLoading = false
    })
  }
  /**
   * Destruction du composant
   */
  ngOnDestroy() {
    this.watcherDestroy();
  }
}


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
import { HumanResourceSelectedInterface } from '../workforce/workforce.page'
import { today } from 'src/app/utils/dates'

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
   * isLoading
   */
  isLoading: boolean = false

  /**
   * Constructor
   */
  constructor(
    private userService: UserService,
    public humanResourceService: HumanResourceService
  ) {
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
      this.humanResourceService.hrBackup.subscribe(
        (hrBackup: BackupInterface | null) => {
          //this.onFilterList(hrBackup)
        }
      )
    )
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /*onFilterList(backup: BackupInterface | null = null) {
    if(!backup) {
      return
    }

    this.isLoading = true
    this.humanResourceService
      .onFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        this.dateSelected,
        null,
        [1,2,3]
      )
      .then(({ list, allPersons }) => {
        //console.log({list, allPersons})

        let listAgent: HumanResourceSelectedInterface[] = []
        list.map((group: any) => {
          listAgent = listAgent.concat(group.hr || [])

          const contentieux = this.humanResourceService.contentieuxReferentielOnly.getValue().map(c => c.id)
          let etpt = 0
          listAgent.map(a => {
            const etp = a.etp
            const percent = sumBy((a.currentActivities || []).filter(c => contentieux.includes(c.contentieux.id)), percent) 
            const indispo = a.hasIndisponibility

            let etptAgent = etp * percent - indispo
            if(etptAgent < 0) {
              etptAgent = 0
            }
            
            etpt += etptAgent
          })
        })

        const agentHaveUpdate: {inPast: HumanResourceSelectedInterface[], inFutur: HumanResourceSelectedInterface[]} = {
          inPast: [],
          inFutur: []
        }

        console.log(listAgent)
        const fistyDayLater = today(this.dateSelected)
        fistyDayLater.setDate(fistyDayLater.getDate() + 15)

        for(let i = 0; i < listAgent.length; i++) {
          const agent = listAgent[i]
          //console.log(agent, agent?.currentSituation, agent?.situations, this.humanResourceService.findAllSituations(agent, this.dateSelected, 'desc', true), this.humanResourceService.findAllSituations(agent, this.dateSelected, 'desc', false))
          const inFuture = this.humanResourceService.findAllSituations(agent, this.dateSelected, 'desc', true)

          if(inFuture.some(s => today(s.dateStart).getTime() <= fistyDayLater.getTime())) {
            agentHaveUpdate.inFutur.push(agent)
          }


          console.log(agent, inFuture.filter(s => today(s.dateStart).getTime() <= fistyDayLater.getTime()))
        }
        //listAgent

        this.isLoading = false
      })}*/
}

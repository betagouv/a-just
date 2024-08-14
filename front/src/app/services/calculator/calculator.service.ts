import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { MainClass } from 'src/app/libs/main-class'
import { month, setTimeToMidDay } from 'src/app/utils/dates'
import { ContentieuxOptionsService } from '../contentieux-options/contentieux-options.service'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'

/**
 * Service du calculateur
 */
@Injectable({
  providedIn: 'root',
})
export class CalculatorService extends MainClass {
  /**
   * Liste des datas d'un resultat de calculateur
   */
  calculatorDatas: BehaviorSubject<CalculatorInterface[]> = new BehaviorSubject<
    CalculatorInterface[]
  >([])
  /**
   * Date de début du calculateur
   */
  dateStart: BehaviorSubject<Date | null> = new BehaviorSubject<Date | null>(
    null
  )
  /**
   * Date de fin du calculateur
   */
  dateStop: BehaviorSubject<Date | null> = new BehaviorSubject<Date | null>(
    null
  )
  /**
   * Liste des réferentiels sélectionnées
   */
  referentielIds: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([])
  /**
    * Liste des fonctions selectionnées
    */
  selectedFonctionsIds: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([])
  /**
    * Liste des fonctions selectionnées
    */
  categorySelected: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null)


  /**
   * Constructeur
   * @param serverService 
   * @param humanResourceService 
   * @param contentieuxOptionsService 
   */
  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService,
    private contentieuxOptionsService: ContentieuxOptionsService
  ) {
    super()

    this.humanResourceService.backupId.subscribe(() => {
      this.dateStart.next(null)
      this.dateStop.next(null)
    })
  }

  /**
   * API retourne la liste du tableau du calculateur pour une juridiction et une date choisie
   * @param categorySelected 
   * @param selectedFonctionsIds 
   * @returns 
   */
  filterList(categorySelected: string, selectedFonctionsIds: number[] | null) {
    console.log('FILTER LIST')
    console.log('BACK Start', this.dateStart.getValue())
    console.log('BACK Stop', this.dateStop.getValue())
    return this.serverService
      .post(`calculator/filter-list`, {
        backupId: this.humanResourceService.backupId.getValue(),
        dateStart: setTimeToMidDay(this.dateStart.getValue()),
        dateStop: setTimeToMidDay(this.dateStop.getValue()),
        contentieuxIds: this.referentielIds.getValue(),
        optionBackupId: this.contentieuxOptionsService.backupId.getValue(),
        categorySelected,
        selectedFonctionsIds,
      })
      .then((data) => data.data || [])
  }

  changePeriodSelected(monthToAdd: number) {
    this.dateStart.next(month(this.dateStart.getValue(), monthToAdd))
    console.log('step1', this.dateStop.getValue())
    this.dateStop.next(month(this.dateStop.getValue(), monthToAdd, 'lastDay'))
    console.log('step2', this.dateStop.getValue())
  }
}

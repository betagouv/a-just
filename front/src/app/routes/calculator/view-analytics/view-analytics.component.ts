import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { maxBy } from 'lodash'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'

/**
 * Composant de la page en vue analytique
 */

@Component({
  selector: 'aj-view-analytics',
  templateUrl: './view-analytics.component.html',
  styleUrls: ['./view-analytics.component.scss'],
})
export class ViewAnalyticsComponent extends MainClass implements OnInit, OnDestroy {
  /**
   * Référentiel
   */
  referentiel: ContentieuReferentielInterface[] = []
  /**
   * Filtre des lignes du calculateur visible
   */
  @Input() datasFilted: CalculatorInterface[] = []
  /**
   * Type of category selected
   */
  @Input() categorySelected: string = ''
  /**
   * Define max DTES
   */
  dtesMax: number = 0
  /**
   * Définie le max des stocks
   */
  stockMax: number = 0
  /**
   * Define max Entrées
   */
  entreesMax: number = 0
  /**
   * Définie le max Sorties
   */
  sortiesMax: number = 0
  /**
   * Définie le max ETPT Siege
   */
  siegeMax: number = 0
  /**
   * Définie le max ETPT Greffe
   */
  greffeMax: number = 0
  /**
   * Définie le max ETPT EAM
   */
  eamMax: number = 0
  /**
   * Show detail of coverture
   */
  showDetailCover: boolean = false
  /**
   * Show detail of stock
   */
  showDetailStock: boolean = false
  /**
   * Show detail of entrees
   */
  showDetailEntrees: boolean = false
  /**
   * Show detail of sorties
   */
  showDetailSorties: boolean = false
  /**
   * Show detail of ETPT Siège
   */
  showDetailETPTSiege: boolean = false
  /**
   * Show detail of ETPT Greffe
   */
  showDetailETPTGreffe: boolean = false
  /**
   * Show detail of ETPT EAM
   */
  showDetailETPTEam: boolean = false

  /**
   * Constructor
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService
  ) {
    super()
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        )
      })
    )
  }

  /**
   * Suppresion des observables lors de la suppression du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  ngOnChanges() {
    console.log('datasFilted', this.datasFilted)
    const allDTES = [...this.datasFilted.map(d => (d.realDTESInMonthsStart || 0)), ...this.datasFilted.map(d => (d.realDTESInMonths || 0))]
    this.dtesMax = (Math.max(...allDTES) || 0) * 1.1
    const allStocks = [...this.datasFilted.map(d => (d.lastStock || 0))]
    this.stockMax = (Math.max(...allStocks) || 0) * 1.1
    const allEntrees = [...this.datasFilted.map(d => (d.totalIn || 0))]
    this.entreesMax = (Math.max(...allEntrees) || 0) * 1.1
    const allSorties = [...this.datasFilted.map(d => (d.totalOut || 0))]
    this.sortiesMax = (Math.max(...allSorties) || 0) * 1.1
    const allSeges = [...this.datasFilted.map(d => (d.etpMag || 0))]
    this.siegeMax = (Math.max(...allSeges) || 0) * 1.1
    const allGreffes = [...this.datasFilted.map(d => (d.etpFon || 0))]
    this.greffeMax = (Math.max(...allGreffes) || 0) * 1.1
    const allEAM = [...this.datasFilted.map(d => (d.etpCont || 0))]
    this.eamMax = (Math.max(...allEAM) || 0) * 1.1
  }

  getHours(value: number) {
    return Math.floor(value)
  }

  getMinutes(value: number) {
    return (Math.floor((value - Math.floor(value)) * 60)+'').padStart(2, '0')
  }

  openAll() {
    this.showDetailCover = true;
    this.showDetailStock = true;
    this.showDetailEntrees = true;
    this.showDetailSorties = true;
    this.showDetailETPTSiege = true;
    this.showDetailETPTGreffe = true;
    this.showDetailETPTEam = true;
  }
}

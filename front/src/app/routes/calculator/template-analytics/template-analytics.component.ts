import { CommonModule } from '@angular/common'
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core'
import { GraphsVerticalsLinesComponent } from '../view-analytics/graphs-verticals-lines/graphs-verticals-lines.component'
import { GraphsNumbersComponent } from '../view-analytics/graphs-numbers/graphs-numbers.component'
import { MainClass } from '../../../libs/main-class'
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel'
import { OPACITY_20 } from '../../../constants/colors'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { ReferentielService } from '../../../services/referentiel/referentiel.service'
import { UserService } from '../../../services/user/user.service'
import { SanitizeHtmlPipe } from '../../../pipes/sanitize-html/sanitize-html.pipe'
import { GraphsProgressComponent } from '../view-analytics/graphs-progress/graphs-progress.component'
import { CalculatorService } from '../../../services/calculator/calculator.service'

/**
 * Interface des lignes d'analyse
 */
export interface AnalyticsLine {
  /**
   * Titre de la ligne
   */
  title: string
  /**
   * Description de la ligne
   */
  description?: string
  /**
   * Type de données
   */
  dataType: string
  /**
   * Type de la ligne
   */
  type: string
  /**
   * Valeurs de la ligne
   */
  values?: any[][]
  /**
   * Valeur maximale de la ligne
   */
  lineMax: number | null
  /**
   * Variations de la ligne
   */
  variations: {
    label: string
    isOption?: boolean
    /**
     * Valeurs de la variation
     */
    values: (number | string | null)[]
    subTitle?: string
    /**
     * Afficher l'arrow
     */
    showArrow?: boolean
    type?: string
    /**
     * Date de début
     */
    dateStart?: Date
    /**
     * Date de fin
     */
    dateStop?: Date
    /**
     * Graphique
     */
    graph?: {
      /**
       * Type du graphique
       */
      type: string
      /**
       * Date de début
       */
      dateStart: Date
      /**
       * Date de fin
       */
      dateStop: Date
      /**
       * Couleur du graphique
       */
      color: string
    }
  }[]
  /**
   * Options visibles
   */
  optionsVisibles?: boolean
}

/**
 * Composant de la page en vue analytique
 */

@Component({
  standalone: true,
  imports: [CommonModule, GraphsVerticalsLinesComponent, GraphsNumbersComponent, SanitizeHtmlPipe, GraphsProgressComponent],
  selector: 'aj-template-analytics',
  templateUrl: './template-analytics.component.html',
  styleUrls: ['./template-analytics.component.scss'],
})
export class TemplateAnalyticsComponent extends MainClass implements OnInit, OnDestroy {
  calculatorService = inject(CalculatorService)
  private humanResourceService = inject(HumanResourceService)
  private referentielService = inject(ReferentielService)
  public userService = inject(UserService)
  /**
   * Référentiel
   */
  referentiel: ContentieuReferentielInterface[] = []
  /**
   * Opacité background des contentieux
   */
  OPACITY = OPACITY_20
  /**
   * Templates
   */
  @Input() lines: AnalyticsLine[] = []

  /**
   * Constructor
   */
  constructor() {
    super()
  }

  /**
   * Initialisation du composant
   */
  ngOnInit() {
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter((r) => this.referentielService.idsIndispo.indexOf(r.id) === -1 && this.referentielService.idsSoutien.indexOf(r.id) === -1)
      }),
    )
  }

  /**
   * Suppresion des observables lors de la suppression du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Changement des propriétés
   */
  ngOnChanges() {}

  /**
   * Récupère les options visibles
   * @param line Ligne d'analyse
   * @returns
   */
  getOptionsToShow(line: AnalyticsLine) {
    const options = line.variations || []
    return line.optionsVisibles
      ? options.filter((o) => o.isOption === true || o.isOption === undefined)
      : options.filter((o) => o.isOption === false || o.isOption === undefined)
  }

  /**
   * Récupère les options visibles
   * @param line
   * @returns
   */
  hasOption(line: AnalyticsLine) {
    const options = line.variations || []
    return options.filter((o) => o.isOption === true).length
  }

  /**
   * Récupère les graphiques
   * @param line
   * @returns
   */
  getGraphs(line: AnalyticsLine): { type: string; dateStart: Date; dateStop: Date; color: string }[] {
    // @ts-ignore
    return this.getOptionsToShow(line)
      .filter((o) => o.graph)
      .map((o) => o.graph)
  }

  /**
   * Vérifie si la valeur est infinie
   * @param value
   * @returns
   */
  isInfinity(value: any): boolean {
    return value === Infinity || value === -Infinity
  }
}

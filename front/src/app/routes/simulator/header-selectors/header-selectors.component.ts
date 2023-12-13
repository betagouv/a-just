import { Component, OnInit } from '@angular/core';
import { dataInterface } from 'src/app/components/select/select.component';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
import { MainClass } from 'src/app/libs/main-class';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
import { SimulatorService } from 'src/app/services/simulator/simulator.service';
import { UserService } from 'src/app/services/user/user.service';
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from 'src/app/utils/user';

@Component({
  selector: 'aj-header-selectors',
  templateUrl: './header-selectors.component.html',
  styleUrls: ['./header-selectors.component.scss']
})
export class HeaderSelectorsComponent extends MainClass {
  /**
 * Contentieux selectionné
 */
  contentieuId: number | null = null
  /**
   * Tous les référentiel
   */
  formReferentiel: dataInterface[] = []

  /**
 * Liste des fonctions pour la catégorie selectionnée
 */
  functionsList: Array<any> = []
  /**
 * Identifiant(s) de fonction selectionnée(s)
 */
  selectedFonctionsIds: number[] = []

  /**
 * Référentiel selectionné
 */
  referentiel: ContentieuReferentielInterface[] = []
  /**
   * Sous-contentieux selectionné(s)
   */
  subList: number[] = []

  /**
 * Indicateur de selection de paramètre de simulation
 */
  disabled: string = 'disabled'

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

  constructor(
    private simulatorService: SimulatorService,
    private userService: UserService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService
  ) {
    super()
    this.loadFunctions()

    this.watch(
      this.simulatorService.disabled.subscribe((disabled) => {
        this.disabled = disabled
      }))
    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)
      })
    )
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        )
        this.formatReferentiel()
      })
    )
    this.watch(
      this.simulatorService.selectedCategory.subscribe((u) => {
        this.loadFunctions()
      })
    )
    this.watch(
      this.simulatorService.contentieuOrSubContentieuId.subscribe((values) => {
        if (values === null) {
          this.contentieuId = null
          this.subList = []
          this.loadFunctions()
        }
      })
    )

    this.simulatorService.selectedCategory.subscribe(() => {
      this.loadFunctions()
    })
  }

  /**
 * Chargement de la liste des fonctions
 */
  loadFunctions() {
    const finalList = this.humanResourceService.fonctions
      .getValue()
      .filter(
        (v) =>
          v.categoryId === this.simulatorService.selectedCategory.getValue()?.id
      )
      .map((f: HRFonctionInterface) => ({
        id: f.id,
        value: f.code,
      }))
    this.selectedFonctionsIds = finalList.map((a) => a.id)
    this.functionsList = finalList
    this.simulatorService.selectedFonctionsIds.next(this.selectedFonctionsIds)
  }

  /**
   * Formatage du référentiel
   */
  formatReferentiel() {
    this.formReferentiel = this.referentiel.map((r) => ({
      id: r.id,
      value: this.referentielMappingName(r.label),
      childrens: r.childrens?.map((s) => ({
        id: s.id,
        value: s.label,
        parentId: r.id,
      })),
    }))
  }

  /**
 * Selectionner une fonction
 * @param fonctionsId identifiant de la fonction choisie
 */
  onChangeFonctionsSelected(fonctionsId: string[] | number[]) {
    this.selectedFonctionsIds = fonctionsId.map((f) => +f)
    this.simulatorService.selectedFonctionsIds.next(this.selectedFonctionsIds)
  }


  /**
 * Selection de paramètre de simulation
 * @param type contentieux, sous-contentieux, date de début, date de fin
 * @param event capteur d'élément clické
 */
  updateReferentielSelected(type: string = '', event: any = null) {
    if (type === 'referentiel') {
      if (
        this.canViewMagistrat ||
        this.canViewGreffier
      ) {
        this.subList = []
        const fnd = this.referentiel.find((o) => o.id === event[0])
        fnd?.childrens?.map((value) => this.subList.push(value.id))
        this.contentieuId = event[0]
        this.simulatorService.contentieuOrSubContentieuId.next([
          this.contentieuId as number,
        ])
        this.disabled = ''
        this.simulatorService.disabled.next('')
      } else {
        alert(
          "Vos droits ne vous permettent pas d'exécuter une simulation, veuillez contacter un administrateur."
        )
      }
    } else if (type === 'subList') {
      this.subList = event
      const tmpRefLength = this.referentiel.find(
        (v) => v.id === this.contentieuId
      )
      if (!event.length) {
        this.disabled = 'disabled'
        this.simulatorService.disabled.next(this.disabled)
        this.simulatorService.contentieuOrSubContentieuId.next([])
      }
      else {
        if (event.length === tmpRefLength?.childrens?.length)
          this.simulatorService.contentieuOrSubContentieuId.next([
            this.contentieuId as number,
          ])
        else
          this.simulatorService.contentieuOrSubContentieuId.next(this.subList)
        this.disabled = ''
        this.simulatorService.disabled.next(this.disabled)
      }
    }
  }
}

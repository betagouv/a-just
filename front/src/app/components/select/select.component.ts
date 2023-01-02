import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'

/**
 * Interface d'un réferentiel selectionné
 */
export interface dataInterface {
  /**
   * Id référentiel
   */
  id: number
  /**
   * Valeur
   */
  value: string
  /**
   * Valeur précédente
   */
  orignalValue?: string
  /**
   * Sous contentieux
   */
  childrens?: childrenInterface[]
}

/**
 * Interface d'un enfant
 */
export interface childrenInterface {
  /**
   * Id
   */
  id: number
  /**
   * Valeur
   */
  value: string
  /**
   * Id du parent
   */
  parentId?: number
}

/**
 * Composant select designer pour le projet
 */
@Component({
  selector: 'aj-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent extends MainClass implements OnChanges {
  /**
   * Titre du bouton
   */
  @Input() title: string | null = null
  /**
   * Icon à droite
   */
  @Input() icon: string = 'expand_more'
  /**
   * Valeures par défaut
   */
  @Input() value: number | string | null | number[] | string[] = null
  /**
   * Liste des élements de la liste
   */
  @Input() datas: dataInterface[] = []
  /**
   * Si c'est un choix multiple
   */
  @Input() multiple: boolean = true
  /**
   * Sous liste, si il y a
   */
  @Input() subList: number[] | null = null
  /**
   * Id du parent, s'il y a sous liste
   */
  @Input() parent: number | string | null = null
  /**
   * Valeure par défaut
   */
  @Input() defaultRealValue: string = ''
  /**
   * Valeur du champs visible par défaut
   */
  @Input() defaultAllValue: string | null = null
  /**
   * Remonte au parent la ou les valeurs selectionnée
   */
  @Output() valueChange: EventEmitter<number[] | string[]> = new EventEmitter()
  /**
   * Nouvelle sous liste
   */
  subReferentielData: dataInterface[] = []
  /**
   * Valeure changé en visible par humain
   */
  realValue: string = ''

  /**
   * Constructeur
   */
  constructor() {
    super()
  }

  /**
   * Ecoute du changement d'une des valeures d'entrées
   */
  ngOnChanges() {
    this.findRealValue()
  }

  /**
   * Création et recherche du champ visible par humain soit le realValue
   */
  findRealValue() {
    let find = !this.parent
      ? this.datas.find((d) => d.id === this.value)
      : this.datas.find((d) => d.id === this.parent)

    let tmpStr = ''

    if (find && !this.subList && typeof this.value === 'number') {
      this.datas.map((v) => {
        if (v.id === this.value) {
          tmpStr = tmpStr.concat(v.value, tmpStr)
        }
      })
      this.realValue = tmpStr
    } else if (
      find &&
      this.subList &&
      this.value &&
      Object.keys(this.value).length !== find.childrens?.length
    ) {
      this.subReferentielData = []
      this.value = this.subList
      ;[find.childrens].map((s) =>
        s?.map((t) => {
          this.subReferentielData.push(t)
          tmpStr = (this.value as number[]).includes(t.id as never)
            ? tmpStr.concat(t.value, ', ')
            : tmpStr
        })
      )
      this.realValue = tmpStr.slice(0, -2)
    } else if (
      find &&
      this.subList &&
      this.value &&
      Object.keys(this.value).length === find.childrens?.length
    ) {
      this.subReferentielData = []
      this.value = this.subList
      ;[find.childrens].map((s) =>
        s?.map((t) => this.subReferentielData.push(t))
      )
      this.realValue = 'Tous'
    } else if (Array.isArray(this.value) && this.value.length !== 0) {
      const arrayValues = Array.isArray(this.value) ? this.value : [this.value]
      this.realValue = ''

      if (
        this.value.length === this.datas.length &&
        this.defaultAllValue !== null
      ) {
        this.realValue = this.defaultAllValue
      } else
        this.datas.map((v) => {
          arrayValues.map((x) => {
            if (v.id === x) {
              tmpStr = tmpStr.concat(v.value, ', ')
              this.realValue = tmpStr.slice(0, -2)
            }
          })
        })
    } else {
      this.realValue = ''
    }
  }

  /**
   * Nouvelle liste ou item sélectionnée
   * @param list
   * @returns void
   */
  onSelectedChanged(list: number[] | number) {
    if (this.parent && Array.isArray(list)) {
      if (list.length === 0) this.value = this.subList = []
      else if (list.length === 1) this.value = list
      else if (list.length === 2 && this.subReferentielData.length !== 2)
        this.value = this.subList = list.filter(
          (v) => ![this.value as number[]][0].includes(v)
        )
      else if (list.length === this.subReferentielData.length) this.value = list
      else if (list.length === this.subReferentielData.length - 1)
        this.value = this.subList = [this.value as number[]][0].filter(
          (v) => !list.includes(v)
        )
    } else if (typeof list === 'number') this.value = [list]
    else this.value = list

    this.valueChange.emit(this.value as number[])
    this.findRealValue()
  }
}

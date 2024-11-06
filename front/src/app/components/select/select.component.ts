import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  TemplateRef,
} from '@angular/core';
import { SelectCheckAllComponent } from './select-check-all/select-check-all.component';
import { MainClass } from '../../libs/main-class';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Interface d'un réferentiel selectionné
 */
export interface dataInterface {
  /**
   * Id référentiel
   */
  id: number;
  /**
   * Valeur
   */
  value: string;
  /**
   * Force rendered
   */
  renderHTML?: string;
  /**
   * Valeur précédente
   */
  orignalValue?: string;
  /**
   * Valeur au pluriel
   */
  orignalValuePlurial?: string;
  /**
   * Sous contentieux
   */
  childrens?: childrenInterface[];
}

/**
 * Interface d'un enfant
 */
export interface childrenInterface {
  /**
   * Id
   */
  id: number;
  /**
   * Valeur
   */
  value: string;
  /**
   * Id du parent
   */
  parentId?: number;
}

/**
 * Composant select designer pour le projet
 */
@Component({
  selector: 'aj-select',
  standalone: true,
  imports: [SelectCheckAllComponent, CommonModule, MatIconModule],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent extends MainClass implements OnChanges {
  /**
   * Titre du bouton
   */
  @Input() title: string | null = null;
  /**
   * Icon à droite
   */
  @Input() icon: string = 'expand_more';
  /**
   * Valeures par défaut
   */
  @Input() value: number | string | null | number[] | string[] = null;
  /**
   * Liste des élements de la liste
   */
  @Input() datas: dataInterface[] = [];
  /**
   * Si c'est un choix multiple
   */
  @Input() multiple: boolean = true;
  /**
   * Sous liste, si il y a
   */
  @Input() subList: number[] | null = null;
  /**
   * Id du parent, s'il y a sous liste
   */
  @Input() parent: number | string | null = null;
  /**
   * Valeure par défaut
   */
  @Input() defaultRealValue: string = '';
  /**
   * Valeur du champs visible par défaut
   */
  @Input() defaultAllValue: string | null = null;
  /**
   * Parmétrage au niveau des boutons d'actions en haut à gauche
   */
  @Input() subTitleTemplate: TemplateRef<any> | undefined;
  /**
   * Remonte au parent la ou les valeurs selectionnée
   */
  @Output() valueChange: EventEmitter<number[] | string[]> = new EventEmitter();
  /**
   * Nouvelle sous liste
   */
  subReferentielData: dataInterface[] = [];
  /**
   * Valeure changé en visible par humain
   */
  realValue: string = '';

  /**
   * Constructeur
   */
  constructor() {
    super();
  }

  /**
   * Ecoute du changement d'une des valeures d'entrées
   */
  ngOnChanges() {
    this.findRealValue();
  }

  /**
   * Création et recherche du champ visible par humain soit le realValue
   */
  findRealValue() {
    let find = !this.parent
      ? this.datas.find((d) => d.id === this.value)
      : this.datas.find((d) => d.id === this.parent);

    let tmpStr = '';

    if (find && !this.subList && typeof this.value === 'number') {
      this.datas.map((v) => {
        if (v.id === this.value) {
          tmpStr = tmpStr.concat(v.value, tmpStr);
        }
      });
      this.realValue = tmpStr;
    } else if (
      find &&
      this.subList &&
      this.value &&
      Object.keys(this.value).length !== find.childrens?.length
    ) {
      this.subReferentielData = [];
      this.value = this.subList;
      [find.childrens].map((s) =>
        s?.map((t) => {
          this.subReferentielData.push(t);
          tmpStr = (this.value as number[]).includes(t.id as never)
            ? tmpStr.concat(t.value, ', ')
            : tmpStr;
        })
      );
      this.realValue = tmpStr.slice(0, -2);
    } else if (
      find &&
      this.subList &&
      this.value &&
      Object.keys(this.value).length === find.childrens?.length
    ) {
      this.subReferentielData = [];
      this.value = this.subList;
      [find.childrens].map((s) =>
        s?.map((t) => this.subReferentielData.push(t))
      );
      this.realValue = 'Tous';
    } else if (Array.isArray(this.value) && this.value.length !== 0) {
      const arrayValues = Array.isArray(this.value) ? this.value : [this.value];
      this.realValue = '';

      if (
        this.value.length === this.datas.length &&
        this.defaultAllValue !== null
      ) {
        this.realValue = this.defaultAllValue;
      } else
        this.datas.map((v) => {
          arrayValues.map((x) => {
            if (v.id === x) {
              tmpStr = tmpStr.concat(v.value, ', ');
              this.realValue = tmpStr.slice(0, -2);
            }
          });
        });
    } else {
      this.realValue = '';
    }
  }

  /**
   * Nouvelle liste ou item sélectionnée
   * @param list
   * @returns void
   */
  onSelectedChanged(list: number[] | number) {
    if (typeof list === 'number') this.value = [list];
    else this.value = list;

    this.valueChange.emit(this.value as number[]);
    this.findRealValue();
  }

  /**
   * Verification de l'emplacement du menu déroulent lorsqu'il est ouvert
   */
  openDropDown(matSelect: any) {
    matSelect.open();
    setTimeout(() => {
      var dropDowns = document.querySelectorAll('[id^="cdk-overlay"]');
      dropDowns.forEach((el) => {
        var rect = el.getBoundingClientRect();
        if (rect.left + rect.width > window.innerWidth) {
          (el as HTMLElement).style.left = 'auto';
          (el as HTMLElement).style.right = '0px';
        }
      });
    }, 1);
  }
}

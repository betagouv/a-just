import { CommonModule } from '@angular/common';
import { ElementRef, HostListener, ViewChild } from '@angular/core';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ItemInterface } from '../../interfaces/item';
import { MatIconModule } from '@angular/material/icon';

/**
 * Comoposant liste
 */

@Component({
  selector: 'aj-list-selection',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './list-selection.component.html',
  styleUrls: ['./list-selection.component.scss'],
})
export class ListSelectionComponent implements OnChanges {
  /**
   * Dom de selection
   */
  @ViewChild('selectArea') selectArea: ElementRef<HTMLElement> | null = null;
  /**
   * Titre du bouton
   */
  @Input() title: string = '';
  /**
   * Icon affiché sur la droite
   */
  @Input() icon: string = '';
  /**
   * Liste des éléments de la liste
   */
  @Input() list: ItemInterface[] = [];
  /**
   * Id de l'élement selectionné
   */
  @Input() value: string | number | null = null;
  /**
   * Liste des id des élements selectionnés
   */
  @Input() values: (string | number)[] = [];
  /**
   * Autorisation de la selection multiple
   */
  @Input() multiple: boolean = false;
  /**
   * Default all label
   */
  @Input() labelPreviewText: string = 'Toutes';
  /**
   * Valeur de l'ID selectionnée changée
   */
  @Output() valueChanged: EventEmitter<string | number | null> =
    new EventEmitter<string | number | null>();
  /**
   * Valeurs des ID sélectionnées changées
   */
  @Output() valuesChanged: EventEmitter<(string | number)[]> = new EventEmitter<
    (string | number)[]
  >();
  /**
   * Information au parent de l'ouverture du panneau de la liste
   */
  @Output() onOpen: EventEmitter<string> = new EventEmitter<string>();
  /**
   * Valeures internes des ids sélectionnées
   */
  itemsSelected: ItemInterface[] = [];
  /**
   * Boolean de la popin ouverte ou fermée
   */
  onOpenDropdown: boolean = false;
  /**
   * Limite de hauteur de la liste
   */
  maxHeightDropdown: number | null = null;
  /**
   * Renvu visuel des la liste des ID sélectionnées
   */
  labelPreview: string = '';

  /**
   * Détection d'un click n'importe où pour fermer
   */
  @HostListener('document:click', ['$event'])
  onClick() {
    this.onOpenDropdown = false;
  }

  /**
   * Construteur
   */
  constructor() {}

  /**
   * Detection de la valeure selectionnée et formatage des données pour un rendu visuel
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] || changes['list'] || changes['values']) {
      if (this.multiple === false) {
        const value = this.value
          ? this.list.find((l) => l.id === this.value) || null
          : null;

        this.itemsSelected = value ? [value] : [];
      } else {
        this.itemsSelected = this.list.reduce(
          (acc: ItemInterface[], cur: ItemInterface) => {
            if (this.values && this.values.indexOf(cur.id) !== -1) {
              acc.push(cur);
            }
            return acc;
          },
          []
        );
      }
    }

    if (this.values && this.values.length === this.list.length)
      this.labelPreview = this.labelPreviewText;
    else this.labelPreview = this.itemsSelected.map((i) => i.label).join(', ');
  }

  /**
   * Remonter au parent le changement d'état de l'élement sélectionné
   * @param item
   */
  onSelect(item: string | number) {
    this.onOpenDropdown = false;
    this.value = item;
    this.valueChanged.next(this.value);
  }

  /**
   * Remonter au parent le changement d'état des élements sélectionnés
   * @param item
   */
  onSelectMultiple(item: string | number) {
    const findIndex = this.values.findIndex((v) => v === item);
    if (findIndex === -1) {
      this.values.push(item);
    } else {
      this.values.splice(findIndex, 1);
    }
    this.valuesChanged.next(this.values);
    this.itemsSelected = this.list.reduce(
      (acc: ItemInterface[], cur: ItemInterface) => {
        if (this.values && this.values.indexOf(cur.id) !== -1) {
          acc.push(cur);
        }
        return acc;
      },
      []
    );
    this.labelPreview = this.itemsSelected.map((i) => i.label).join(', ');
  }

  /**
   * Ouvre ou ferme la liste
   */
  onToggleDropdown() {
    this.onOpenDropdown = !this.onOpenDropdown;
    this.maxHeightDropdown = null;

    if (this.onOpenDropdown) {
      this.onOpen.emit('open');
    }

    setTimeout(() => {
      const domArea = this.selectArea?.nativeElement;
      if (domArea) {
        const { bottom, height } = domArea.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const margin = 16;

        if (bottom > windowHeight - margin) {
          this.maxHeightDropdown = height - margin + windowHeight - bottom;
        }
      }
    }, 10);
  }

  /**
   * Ferme la liste
   */
  close() {
    this.onOpenDropdown = false;
    this.maxHeightDropdown = null;
  }

  /**
   * Force la sélection de tout les éléments
   */
  onSelectAll() {
    if (this.values.length === this.list.length) {
      this.values = [];
    } else {
      this.values = this.list.map((i) => i.id);
    }

    this.valuesChanged.next(this.values);

    this.itemsSelected = this.list.reduce(
      (acc: ItemInterface[], cur: ItemInterface) => {
        if (this.values && this.values.indexOf(cur.id) !== -1) {
          acc.push(cur);
        }
        return acc;
      },
      []
    );
    if (this.values.length === this.list.length)
      this.labelPreview = this.labelPreviewText;
    else this.labelPreview = this.itemsSelected.map((i) => i.label).join(', ');
  }
}

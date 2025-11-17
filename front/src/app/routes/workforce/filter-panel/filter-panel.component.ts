import {
  Output,
  EventEmitter,
  Component,
  Input,
  HostListener,
  ElementRef,
  AfterViewInit,
  OnChanges,
  ViewChild,
  SimpleChanges,
} from '@angular/core';
import { orderBy, sortBy, sumBy } from 'lodash';
import { HumanResourceSelectedInterface } from '../workforce.page';
import { CommonModule } from '@angular/common';
import { ListSelectionComponent } from '../../../components/list-selection/list-selection.component';
import { MainClass } from '../../../libs/main-class';
import { dataInterface } from '../../../components/select/select.component';
import { ItemInterface } from '../../../interfaces/item';
import { HRFonctionService } from '../../../services/hr-fonction/hr-function.service';
import { ReferentielService } from '../../../services/referentiel/referentiel.service';
import { HumanResourceService } from '../../../services/human-resource/human-resource.service';

/**
 * Interface d'un filtre
 */

export interface FilterPanelInterface {
  /**
   * Clé de tri
   */
  sort: string | number | null;
  /**
   * Label de tri
   */
  sortName: string | null;
  /**
   * Traitement du tri
   */
  sortFunction: Function | null;
  /**
   * Clé de l'ordre
   */
  order: string | number | null;
  /**
   * Icon d'ordre
   */
  orderIcon: string | null;
  /**
   * Filtre fonction
   */
  filterFunction: Function | null;
  /**
   * Filtre des valeurs
   */
  filterValues: (string | number)[] | null;
  /**
   * Filtre des indispo
   */
  filterIndispoValues: (string | number)[] | null;
  /**
   * Filtre des noms
   */
  filterNames: string | null;
  /**
   * Filtre rendu visuel dans le paneau
   */
  display?: string | number | null;
}

/**
 * Paneau de filtre de la page workforce
 */
@Component({
  selector: 'filter-panel',
  standalone: true,
  imports: [CommonModule, ListSelectionComponent],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
})
export class FilterPanelComponent
  extends MainClass
  implements AfterViewInit, OnChanges
{
  /**
   * Event au père lors d'une mise à jour
   */
  @Output() update: EventEmitter<FilterPanelInterface> = new EventEmitter();
  /**
   * Event au père lors de la demande de fermeture
   */
  @Output() close: EventEmitter<any> = new EventEmitter();
  /**
   * Event qui informate quand la liste des referentiels changes
   */
  @Output() updateReferentielIds: EventEmitter<{ list: any; subList: any }> =
    new EventEmitter();
  /**
   * Liste complète des tris possibles
   */
  sortList = [
    {
      id: 'name',
      label: 'Nom',
      sortFunction: (list: HumanResourceSelectedInterface[]) => {
        return sortBy(list, [
          (h: HumanResourceSelectedInterface) =>
            `${h.lastName} ${h.firstName}`.toLowerCase(),
        ]);
      },
    },
    {
      id: 'function',
      label: 'Fonction',
      sortFunction: (list: HumanResourceSelectedInterface[]) =>
        sortBy(list, ['fonction.rank']),
    },
    {
      id: 'updateAt',
      label: 'Date de mise à jour',
      sortFunction: (list: HumanResourceSelectedInterface[]) =>
        sortBy(list, [
          (h: HumanResourceSelectedInterface) =>
            // @ts-ignore
            new Date(h.updatedAt).getTime(),
        ]),
    },
    {
      id: 'affected',
      label: "Taux d'affectation",
      sortFunction: (list: HumanResourceSelectedInterface[]) => {
        return sortBy(list, [
          (h: HumanResourceSelectedInterface) => {
            const allMainActivities = (h.currentActivities || []).filter(
              (c) =>
                this.referentielService.mainActivitiesId.indexOf(
                  c.contentieux.id
                ) !== -1
            );
            return sumBy(allMainActivities, 'percent');
          },
        ]);
      },
    },
  ];
  /**
   * Liste complète des ordres
   */
  orderList = [
    {
      id: 'asc',
      icon: 'sort-desc',
      label: 'Ordre ascendant',
    },
    {
      id: 'desc',
      icon: 'sort-asc',
      label: 'Ordre descendant',
    },
  ];
  /**
   * List des tris possibles
   */
  displayList = [
    {
      id: 'nom/prénom',
      icon: 'sort-desc',
      label: 'nom/prénom',
    },
    {
      id: 'prénom/nom',
      icon: 'sort-asc',
      label: 'prénom/nom',
    },
  ];
  /**
   * Mode d'affichage du composant
   */
  @Input() button: boolean = false;
  /**
   * Valeur de filtre déjà selectionnée
   */
  @Input() filterValues: (string | number)[] | null = null;
  /**
   * Valeur de filtre des indispo
   */
  @Input() filterIndispoValues: (string | number)[] | null = null;
  /**
   * Valeur de tri déjà selectionnée
   */
  @Input() sortValue: string | number | null = null;
  /**
   * Valeur d'ordre déjà selectionné
   */
  @Input() orderValue: string | number | null = null;
  /**
   * Filtre déjà selectionnée
   */
  @Input() displayValue: string | number | null = 'prénom/nom';
  /**
   * Categories déjà selectionnée
   */
  @Input() categories: number[] = [];
  /**
   * Liste des contentieux selectionnées
   */
  @Input() referentielIds: (string | number)[] | null = null;
  /**
   * Liste des sous contentieux selectionnées
   */
  @Input() subReferentielIds: (string | number)[] | null = null;
  /**
   * Referentiels
   */
  @Input() referentiels: dataInterface[] = [];
  /**
   * Dom de la popin
   */
  @ViewChild('popin') popin: ElementRef<HTMLElement> | null = null;
  /**
   * Position left par rapport à l'écran complet
   */
  leftPosition: number = 0;
  /**
   * Position top par rapport à l'écran complet
   */
  topPosition: number = 0;
  /**
   * List des filtres possibles
   */
  filterList: ItemInterface[] = [];
  /**
   * List des filtres des contentieux possibles
   */
  contentieuxFilterList: ItemInterface[] = [];
  /**
   * List des filtres des sous contentieux possibles
   */
  subContentieuxFilterList: ItemInterface[] = [];
  /**
   * Valeur par défaut de filtre
   */
  defaultFilterValues: (string | number)[] | null = null;
  /**
   * Valeur par défaut de tri
   */
  defaultSortValue: string | number | null = this.sortList[1].id;
  /**
   * Valeur par défaut d'ordre
   */
  defaultOrderValue: string | number | null = this.orderList[0].id;
  /**
   * Référentiel des indispo
   */
  allIndisponibilityReferentiel: ItemInterface[] = [];

  /**
   * Détection d'un click sur le composant
   */
  @HostListener('click', ['$event'])
  onClick() {
    this.close.emit();
  }

  /**
   * Constructeur
   * @param hrFonctionService
   * @param elementRef
   * @param referentielService
   */
  constructor(
    private hrFonctionService: HRFonctionService,
    private elementRef: ElementRef,
    private referentielService: ReferentielService,
    private humanResourceService: HumanResourceService
  ) {
    super();
  }

  /**
   * Au chargement récupération des contentieux
   */
  ngOnInit() {
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(() => {
        this.allIndisponibilityReferentiel =
          this.humanResourceService.allIndisponibilityReferentiel
            .slice(1)
            .map((r) => ({ id: r.id, label: r.label.replace(/\//g, ' / ') }));

        if (this.filterIndispoValues === null) {
          this.filterIndispoValues = [];
        }
      })
    );
  }

  /**
   * A chaque changement chercher l'élement de filtre selectionnée
   */
  async ngOnChanges(changes: SimpleChanges) {
    if (!this.sortList.find((o) => o.id === this.sortValue)) {
      this.sortValue = this.sortList[1].id;
    }
    if (!this.orderList.find((o) => o.id === this.orderValue)) {
      this.orderValue = this.orderList[0].id;
    }

    if (changes['categories']) {
      this.loadFonctions();
    }
    if (this.button === true && this.filterValues === null) {
      const fonctions = await this.hrFonctionService.getAll();
      const listUsedFunctions = orderBy(
        [...fonctions],
        ['categoryId', 'rank']
      ).filter((f) => this.categories.includes(f.categoryId));
      const idsToExclude = fonctions
        .filter((f) => !this.categories.includes(f.categoryId))
        .map((v) => +v.id);
      this.filterValues = listUsedFunctions.map((f) => f.id);
    }

    if (changes['referentiels']) {
      this.formatReferentielList();
    }
  }

  /**
   * Après le rendu HTML on position la popin de filtre
   */
  ngAfterViewInit() {
    setTimeout(() => {
      let { x, y } =
        this.elementRef.nativeElement.parentNode.getBoundingClientRect();
      const bottomMargin = 100;

      if (this.popin) {
        const popin = this.popin.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight - 50;

        if (y + popin.height + bottomMargin > windowHeight) {
          y = windowHeight - popin.height - bottomMargin;
        }
      }

      this.leftPosition = x;
      this.topPosition = y;
    }, 0);
  }

  /**
   * Chargement des fonctions
   */
  async loadFonctions() {
    const fonctions = await this.hrFonctionService.getAll();
    const listUsedFunctions = orderBy(
      [...fonctions],
      ['categoryId', 'rank']
    ).filter((f) => this.categories.includes(f.categoryId));
    const idsToExclude = fonctions
      .filter((f) => !this.categories.includes(f.categoryId))
      .map((v) => +v.id);

    this.filterList = listUsedFunctions.map((f) => ({
      id: f.id,
      label: f.code || '',
    }));
    this.filterValues =
      this.filterValues === null
        ? listUsedFunctions.map((f) => f.id)
        : this.filterValues.filter((f) => !idsToExclude.includes(+f));

    this.defaultFilterValues = listUsedFunctions.map((f) => f.id);
    if (this.button === true && this.filterValues.length === 0) {
      this.filterValues = listUsedFunctions.map((f) => f.id);
    }
  }

  /**
   * Choix du filtre change
   */
  updateParams() {
    const sortItem = this.sortList.find((o) => o.id === this.sortValue);
    const orderItem = this.orderList.find((o) => o.id === this.orderValue);
    let filterNames = '';
    if (
      this.filterValues &&
      this.filterValues.length !== this.defaultFilterValues?.length
    ) {
      const nbStringToAdd = 3;
      let stringAdd = 0;
      filterNames += this.filterList.reduce((acc, cur) => {
        if (
          this.filterValues &&
          this.filterValues.indexOf(cur.id) !== -1 &&
          stringAdd < nbStringToAdd
        ) {
          if (stringAdd > 0) {
            acc += ', ';
          }
          acc += cur.label;
          stringAdd++;
        }
        return acc;
      }, '');

      if (this.filterValues.length > nbStringToAdd) {
        filterNames +=
          ' et ' + (this.filterValues.length - nbStringToAdd) + ' de plus';
      }
    }

    this.update.next({
      sort: this.sortValue,
      sortName:
        sortItem && sortItem.label && this.sortValue !== this.defaultSortValue
          ? sortItem.label
          : null,
      sortFunction:
        (sortItem && sortItem.sortFunction) ||
        ((l: HumanResourceSelectedInterface) => l),
      order: this.orderValue,
      orderIcon: orderItem && orderItem.icon ? orderItem.icon : null,
      filterValues: this.filterValues,
      filterIndispoValues: this.filterIndispoValues,
      display: this.displayValue,
      filterFunction: (list: HumanResourceSelectedInterface[]) => {
        if (
          this.filterValues === null ||
          this.filterValues.length === this.filterList.length
        ) {
          return list;
        } else {
          return list.filter(
            (h) =>
              h.fonction &&
              this.filterValues &&
              this.filterValues.indexOf(h.fonction.id) !== -1
          );
        }
      },
      filterNames,
    });

    this.updateReferentielIds.emit({
      list: this.referentielIds,
      subList: this.subReferentielIds,
    });
  }

  formatReferentielList() {
    this.contentieuxFilterList = this.referentiels.map((r) => ({
      id: r.id,
      label: r.value,
    }));

    this.updateSubcontentieux();
  }

  updateSubcontentieux(forceSub = false) {
    let list: ItemInterface[] = [];
    this.referentiels.map((cont) => {
      if (
        !this.referentielIds ||
        (this.referentielIds || []).find((refId) => refId === cont.id)
      ) {
        list = [
          ...list,
          ...(cont.childrens || []).map((c) => ({ id: c.id, label: c.value })),
        ];
      }
    });

    this.subContentieuxFilterList = [...list];
    if (this.subReferentielIds === null || forceSub) {
      this.subReferentielIds = list.map((l) => l.id);
    }
  }
}

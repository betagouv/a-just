import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { UserService } from 'src/app/services/user/user.service'
import { HRCategorySelectedInterface } from 'src/app/interfaces/hr-category'
import { HumanResourceSelectedInterface } from '../../workforce/workforce.page'
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from 'src/app/utils/user'

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  selector: 'records-update',
  templateUrl: './records-update.component.html',
  styleUrls: ['./records-update.component.scss'],
})
export class RecordsUpdateComponent extends MainClass implements OnInit, OnDestroy {

  @Input() workforce: HRCategorySelectedInterface[] = []

  categoriesList: HRCategorySelectedInterface[] = [ {
    id: 1,
    label: "Siège",
    textColor: '#000091',
    bgColor: '#e3e3fd',
    hoverColor: 'blue',
    selected: true,
    etpt: 119.48,
    nbPersonal: 122,
    labelPlural: "",
    headerLabel: 'Siège',
    percentAllocated: 71.28,
    //lastUpdate: '12 Avril 2023',
    poste: [ {
      name: 'titulaires',
      selected: true,
      etpt: 105.48,
      nbPersonal: 105,
    }, {
      name: 'placés',
      selected: true,
      etpt: 10.52,
      nbPersonal: 12,
    },  {
      name: 'contractuels',
      selected: true,
      etpt: 3.48,
      nbPersonal: 5,
    }],
  },
  {
    id: 2,
    label: "Greffe",
    textColor: '#a558a0',
    bgColor: '#fee7fc',
    hoverColor: 'purple',
    selected: true,
    etpt: 6.20,
    nbPersonal: 9,
    labelPlural: "",
    headerLabel: 'Greffe',
    percentAllocated: 20,
    //lastUpdate: '24 Mars 2023',
    poste: [ {
      name: 'titulaires',
      selected: true,
      etpt: 105.48,
      nbPersonal: 105,
    }, {
      name: 'placés',
      selected: true,
      etpt: 10.52,
      nbPersonal: 12,
    },  {
      name: 'contractuels',
      selected: true,
      etpt: 3.48,
      nbPersonal: 5,
    }],
  },
  {
    id: 3,
    label: "Autour du magistrat",
    textColor: '#796830',
    bgColor: '#fef6e3',
    hoverColor: 'yellow',
    selected: true,
    etpt: 4.20,
    nbPersonal: 5,
    labelPlural: "",
    headerLabel: 'Autour du magistrat',
    percentAllocated: 0,
    //lastUpdate: '16 Mars 2023',
    poste: [ ],
  }
]

  /**
   * Constructor
   */
  constructor(private userService: UserService) {
    super()
  }

   /**
   * Initialisation des datas au chargement de la page
   */
   ngOnInit() {
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {
  }
}

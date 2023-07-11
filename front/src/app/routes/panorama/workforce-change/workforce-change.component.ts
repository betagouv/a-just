import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { UserService } from 'src/app/services/user/user.service'
import { HumanResourceSelectedInterface } from '../../workforce/workforce.page'
import { today } from 'src/app/utils/dates'



/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  selector: 'workforce-change',
  templateUrl: './workforce-change.component.html',
  styleUrls: ['./workforce-change.component.scss'],
})
export class WorkforceChangeComponent extends MainClass implements OnInit, OnDestroy {


  @Input() listArrivals: HumanResourceSelectedInterface[] = []
  @Input() listDepartures: HumanResourceSelectedInterface[] = []
  @Input() listUnavailabilities: HumanResourceSelectedInterface[] = []

  buttonFilter = "Départ"
  currentPage = 0

  buttons = [
    {
      label: "Départs",
      isSelected: true,
      list: this.listDepartures,
    },
    {
      label: "Arrivées",
      isSelected: false,
      list: this.listDepartures,
    },
    {
      label: "Indisponibilités",
      isSelected: false,
      list: this.listUnavailabilities,
    }
  ]

  filter = ""

  listToPrint : HumanResourceSelectedInterface[] = []


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
    this.listToPrint = this.listDepartures
  }

  changeButtonsState(label : string) {
    this.buttons.map(button => {
      if (button.label === label) {
        button.isSelected = true
        this.buttonFilter = button.label.slice(0, button.label.length - 1)
      }
      else
        button.isSelected = false
    })

    switch (label) {
      case 'Départs':
        this.listToPrint = this.listDepartures
        break;
      case 'Arrivées':
        this.listToPrint = this.listArrivals
        break;
      case 'Indisponibilités': 
        this.listToPrint = this.listUnavailabilities
        break;
    }
    this.currentPage = 0
    console.log('ListToPrint:', this.listToPrint)
  }


  isSituationComing(date : Date | null) {
    const now = today()

    if (date && date > now) {
      return true
    }
    return false
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {
  }
}

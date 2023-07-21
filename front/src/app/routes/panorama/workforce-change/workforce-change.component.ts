import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { UserService } from 'src/app/services/user/user.service'
import { HumanResourceSelectedInterface } from '../../workforce/workforce.page'
import { today, sortDates } from 'src/app/utils/dates'
import { sortNumbers } from 'src/app/utils/numbers'
import { sortBy } from 'lodash'

interface sortButtonsInterface {
  label: string,
  isActive: boolean,
  isReverse: boolean,
  className: string,
  associatedList: HumanResourceSelectedInterface[] | null,
}

interface categoryButtonsInterface {
  label: string,
  isSelected: boolean,
  list: HumanResourceSelectedInterface[],
}


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
  @Input() totalWorkforce : number = 0

  currentPage = 0

  sortButtonsStates = [
    {
      label: 'name',
      isReverse: false
    },
    {
      label: 'assignement',
      isReverse: false
    },
    {
      label: 'departures',
      isReverse: false
    },
    {
      label: 'arrivals',
      isReverse: false
    },
    {
      label: 'indispoStart',
      isReverse: false
    },
    {
      label: 'indispoEnd',
      isReverse: false
    }
  ]
  
  categoryButtons : categoryButtonsInterface[] = [
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

  listToPrint : { category: string, hr: HumanResourceSelectedInterface[] } = {
    category: "",
    hr: []
  }


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
    this.listToPrint = {
      category: "Départ",
      hr : this.listDepartures,
    }
  }

  changeButtonsState(label : string) {
    this.categoryButtons.map(button => {
      if (button.label === label) {
        button.isSelected = true
        this.listToPrint.category = button.label.slice(0, button.label.length - 1)
        //this.buttonFilter = button.label.slice(0, button.label.length - 1)
      }
      else
        button.isSelected = false
    })

    //let filter : sortButtonsInterface[] | undefined = []
    switch (label) {
      case 'Départs':
        this.listToPrint.hr = this.listDepartures
        //filter = this.sortButtons.filter(elem => elem.label = 'Départs')
        break;
      case 'Arrivées':
        this.listToPrint.hr = this.listArrivals
        //filter = this.sortButtons.filter(elem => elem.label = 'Arrivées')
        break;
      case 'Indisponibilités': 
        this.listToPrint.hr = this.listUnavailabilities
        //filter = this.sortButtons.filter(elem => ((elem.label = "Début d'indispo.") || (elem.label = "Fin d'indispo.")))
        break;
    }
    /*if (filter) {
      filter.map(elem => elem.isActive = true)
    }*/

    this.currentPage = 0
  }


  isSituationComing(date : Date | null) {
    const now = today()

    if (date && date > now) {
      return true
    }
    return false
  }

  orderList(category : string) {
    let button : any = null
    switch(category) {
      case 'name': 
        button = this.sortButtonsStates.find(button => button.label === "name")
        if  (button) {
          this.listToPrint.hr =  sortBy(this.listToPrint.hr, [
            (h: HumanResourceSelectedInterface) => {
              return `${h.firstName} ${h.lastName}`.toLowerCase() 
            }
          ])
          if (button.isReverse)
            this.listToPrint.hr.reverse()
          button.isReverse = !button.isReverse
          this.sortButtonsStates.map(button => button.label !== "name" ? button.isReverse = false : null )
        }
        break;
      case 'assignement':
        button = this.sortButtonsStates.find(button => button.label === "assignement")
        if  (button) {
          this.listToPrint.hr = sortBy(this.listToPrint.hr, [(h: HumanResourceSelectedInterface) => {
            return `${h.totalAffected}`
          }])
          if (button.isReverse) 
            this.listToPrint.hr.reverse()
          button.isReverse = !button.isReverse
          this.sortButtonsStates.map(button => button.label !== "assignement" ? button.isReverse = false : null )
        }
        break;
      case 'departures':
        button = this.sortButtonsStates.find(button => button.label === "departures")
        if  (button) { 
          this.listToPrint.hr = sortBy(this.listToPrint.hr, [(h: HumanResourceSelectedInterface) => {
            return new Date(`${h.dateEnd}`)
          }])
          if (button.isReverse) 
            this.listToPrint.hr.reverse()
          button.isReverse = !button.isReverse
          this.sortButtonsStates.map(button => button.label !== "departures" ? button.isReverse = false : null )
        }
        break;
      case 'arrivals':
        button = this.sortButtonsStates.find(button => button.label === "arrivals")
        if  (button) {
          this.listToPrint.hr = sortBy(this.listToPrint.hr, [(h: HumanResourceSelectedInterface) => {
            return new Date(`${h.situations[0].dateStart}`)
          }])
          if (button.isReverse) 
            this.listToPrint.hr.reverse()
          button.isReverse = !button.isReverse
          this.sortButtonsStates.map(button => button.label !== "arrivals" ? button.isReverse = false : null )
        }
        break;
      case 'indispoStart':
        button = this.sortButtonsStates.find(button => button.label === "indispoStart")
        if  (button) {
          this.listToPrint.hr = sortBy(this.listToPrint.hr, [(h: HumanResourceSelectedInterface) => {
            return new Date(`${h.indisponibilities[0].dateStart}`)
          }])
          if (button.isReverse) 
            this.listToPrint.hr.reverse()
          button.isReverse = !button.isReverse
          this.sortButtonsStates.map(button => button.label !== "indispoStart" ? button.isReverse = false : null )
        }
        break;
      case 'indispoEnd':
        button = this.sortButtonsStates.find(button => button.label === "indispoEnd")
        if  (button) {
          this.listToPrint.hr = sortBy(this.listToPrint.hr, [(h: HumanResourceSelectedInterface) => {
            return new Date(`${h.indisponibilities[0].dateStop}`)
          }])
          if (button.isReverse) 
            this.listToPrint.hr.reverse()
          button.isReverse = !button.isReverse
          this.sortButtonsStates.map(button => button.label !== "indispoEnd" ? button.isReverse = false : null )
        }
        break;
    }
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {
  }
}

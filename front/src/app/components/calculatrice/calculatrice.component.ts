import { Component } from '@angular/core'

const calculatriceTabs = ['Vacations', 'Volumes']
@Component({
  selector: 'aj-calculatrice',
  templateUrl: './calculatrice.component.html',
  styleUrls: ['./calculatrice.component.scss'],
})
export class CalculatriceComponent {
  /**
   * Option radio button
   */
  radioItems = 'semaine mois an'.split(' ')

  /**
   * Model utilisé pour les calculs d'ETPT
   */
  model = { 
    vacation : { value : null, option:'semaine',unit: null},
    volume : { value : null, option:'semaine'},
    selectedTab : 'vacation'
  }

  /**
   * Ouvre l'onglet cliqué
   * @param tabName
   */
  openTab(tabName: string) {
    this.model.selectedTab = tabName
  }

  validateNumber(e: any) {
    const charCode = e.which ? e.which : e.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false
    }
    return true
  }

  print() {
    console.log(this.model)
  }
}

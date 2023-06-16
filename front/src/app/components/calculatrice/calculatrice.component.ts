import { Component, OnInit } from '@angular/core'
import { CalculatriceInterface } from 'src/app/interfaces/calculatrice'
import { CalculatriceService } from 'src/app/services/calculatrice/calculatrice.service'

const calculatriceTabs = ['Vacations', 'Volumes']
@Component({
  selector: 'aj-calculatrice',
  templateUrl: './calculatrice.component.html',
  styleUrls: ['./calculatrice.component.scss'],
})
export class CalculatriceComponent implements OnInit {
  /**
   * Option radio button
   */
  radioItems = 'jour mois an'.split(' ')

  /**
   * Model utilisé pour les calculs d'ETPT
   */
  model :CalculatriceInterface = { 
    vacation : { value : null, option:null,unit: null},
    volume : { value : null, option:null},
    selectedTab : ''
  }

  /**
   * Constructeur
   * @param calculatriceService 
   */
  constructor(private calculatriceService:CalculatriceService){}

  /**
   * Déclenchemet à la création du composent
   */
  ngOnInit(): void {
    this.model = this.calculatriceService.dataCalculatrice.value
    console.log(this.model)
  }

  /**
   * Ouvre l'onglet cliqué
   * @param tabName
   */
  openTab(tabName: string) {
    this.model.selectedTab = tabName
  }

  /**
   * Verifie si le char tapé est bien un chiffre
   * @param e 
   * @returns boolean si chiffre ou non
   */
  validateNumber(e: any) {
    const charCode = e.which ? e.which : e.keyCode
    if (e.code !== "KeyM" && charCode > 31 && (charCode < 48 || charCode > 57)) {
      if (charCode=== 46) return true
      return false
    }
    return true
  }

  /**
   * Update le model de donnée de la calculatrice
   */
  updateModel() {
    this.calculatriceService.dataCalculatrice.next(this.model)
  }
}

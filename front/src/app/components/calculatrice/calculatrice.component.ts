import { CommonModule } from '@angular/common'
import { Component, inject, OnDestroy, OnInit } from '@angular/core'
import { CalculatriceInterface } from '../../interfaces/calculatrice'
import { CalculatriceService } from '../../services/calculatrice/calculatrice.service'
import { FormsModule } from '@angular/forms'

/**
 * Composant de la calculatrice
 */
@Component({
  selector: 'aj-calculatrice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculatrice.component.html',
  styleUrls: ['./calculatrice.component.scss'],
})
export class CalculatriceComponent implements OnInit, OnDestroy {
  /**
   * Service de gestion du calculateur
   */
  calculatriceService = inject(CalculatriceService)
  /**
   * Option radio button
   */
  radioItems = 'jour mois an'.split(' ')

  /**
   * Model utilisé pour les calculs d'ETPT
   */
  model: CalculatriceInterface = {
    vacation: { value: null, option: null, unit: null },
    volume: { value: null, option: null },
    selectedTab: '',
  }

  /**
   * Déclenchemet à la création du composent
   */
  ngOnInit(): void {
    this.model = this.calculatriceService.dataCalculatrice.value
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy(): void {
    this.model = {
      vacation: { value: null, option: 'jour', unit: null },
      volume: { value: null, option: 'jour' },
      selectedTab: 'vacation',
    }
    setTimeout(() => {
      this.calculatriceService.dataCalculatrice.next(this.model)
    }, 100)
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
    if (e.code !== 'KeyM' && charCode > 31 && (charCode < 48 || charCode > 57)) {
      if (charCode === 46) return true
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

import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { basicEtptData } from 'src/app/constants/etpt-calculation'
import { CalculatriceInterface } from 'src/app/interfaces/calculatrice'

const periodicData = {
  Magistrat: {
    jour: 208,
    semaine: 41.6,
    mois: 12,
    an: 1,
  },
  Fonctionnaire: {
    jour: 229.57,
    semaine: 45.91,
    mois: 12,
    an: 1,
  },
}

interface periodInterface {
  jour: 'jour'
  semaine: 'semaine'
  mois: 'mois'
  an: 'an'
}
@Injectable({
  providedIn: 'root',
})
export class CalculatriceService {
  /**
   * Contenu de la calculatrice
   */
  dataCalculatrice: BehaviorSubject<CalculatriceInterface> =
    new BehaviorSubject<CalculatriceInterface>({
      vacation: { value: null, option: 'semaine', unit: null },
      volume: { value: null, option: 'semaine' },
      selectedTab: 'vacation',
    })

    /**
     * Constructeur
     */
  constructor() {}

  /**
   * Méthode de calcul selon les paramètres choisis
   * @param category mag ou fonct
   * @returns 
   */
  computeEtptCalculatrice(category: string) {
    const option =
      this.dataCalculatrice.value.selectedTab === 'vacation'
        ? (this.dataCalculatrice.value.vacation.option as keyof periodInterface)
        : (this.dataCalculatrice.value.volume.option as keyof periodInterface)
    const value = Number(
      this.dataCalculatrice.value.selectedTab === 'vacation'
        ? this.dataCalculatrice.value.vacation.value
        : this.dataCalculatrice.value.volume.value
    )
    const unit = Number(
      this.dataCalculatrice.value.selectedTab === 'vacation'
        ? this.dataCalculatrice.value.vacation.unit
        : 0
    )
    const cat = category === 'mag' ? 'Magistrat' : 'Fonctionnaire'
    const nbHoursPerDay = ('nbHoursPerDayAnd' +
      cat) as keyof typeof basicEtptData
    const byDayAndCat = ('nbDaysBy' + cat) as keyof typeof basicEtptData

    if (category === 'fonct' && this.dataCalculatrice.value.selectedTab === 'vacation'){
    return (
      (value / basicEtptData[nbHoursPerDay]) *
        unit *
        periodicData[cat][option] /
      basicEtptData[byDayAndCat]
    )*100
    }
    if(category === 'mag' && this.dataCalculatrice.value.selectedTab === 'vacation'){
    return (unit/basicEtptData[nbHoursPerDay]*value * periodicData[cat][option] /
    basicEtptData[byDayAndCat])*100
    }
    else {
    return value*periodicData[cat][option]/(periodicData[cat]['jour']*basicEtptData[nbHoursPerDay])*100
    }
  }
}

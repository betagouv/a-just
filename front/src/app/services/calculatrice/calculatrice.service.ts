import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { CalculatriceInterface } from '../../interfaces/calculatrice'
import { basicEtptData } from '../../constants/etpt-calculation'

/**
 * Données périodiques des magistrats et fonctionnaires
 */
const periodicData: { [key: string]: any } = {
  /**
   * Magistrat
   */
  Magistrat: {
    jour: 208,
    semaine: 41.6,
    mois: 12,
    an: 1,
  },
  /**
   * Fonctionnaire
   */
  Fonctionnaire: {
    jour: 229.57,
    semaine: 45.91,
    mois: 12,
    an: 1,
  },
}

/**
 * Interface pour les périodes
 */
interface periodInterface {
  /**
   * Jour
   */
  jour: 'jour'
  /**
   * Semaine
   */
  semaine: 'semaine'
  /**
   * Mois
   */
  mois: 'mois'
  /**
   * Année
   */
  an: 'an'
}

/**
 * Service de la calculatrice
 */
@Injectable({
  providedIn: 'root',
})
export class CalculatriceService {
  /**
   * Contenu de la calculatrice
   */
  dataCalculatrice: BehaviorSubject<CalculatriceInterface> = new BehaviorSubject<CalculatriceInterface>({
    vacation: { value: null, option: 'jour', unit: null },
    volume: { value: null, option: 'jour' },
    selectedTab: 'vacation',
  })

  /**
   * Constructeur
   */
  constructor() {
    this.dataCalculatrice.subscribe((calcul) => {
      let reloadDatas = false

      if (typeof calcul.vacation.value === 'string' && calcul.vacation.value.includes(',')) {
        calcul.vacation.value = calcul.vacation.value.replace(/,/g, '.')
        reloadDatas = true
      }

      if (typeof calcul.vacation.unit === 'string' && calcul.vacation.unit.includes(',')) {
        calcul.vacation.unit = calcul.vacation.unit.replace(/,/g, '.')
        reloadDatas = true
      }

      if (typeof calcul.volume.value === 'string' && calcul.volume.value.includes(',')) {
        calcul.volume.value = calcul.volume.value.replace(/,/g, '.')
        reloadDatas = true
      }

      if (reloadDatas) {
        this.dataCalculatrice.next(calcul)
      }
    })
  }

  /**
   * Méthode de calcul selon les paramètres choisis
   * @param category mag ou fonct
   * @returns
   */
  computeEtptCalculatrice(categoryId: string) {
    const option =
      this.dataCalculatrice.value.selectedTab === 'vacation'
        ? (this.dataCalculatrice.value.vacation.option as keyof periodInterface)
        : (this.dataCalculatrice.value.volume.option as keyof periodInterface)
    const value = Number(
      this.dataCalculatrice.value.selectedTab === 'vacation' ? this.dataCalculatrice.value.vacation.value : this.dataCalculatrice.value.volume.value,
    )
    const unit = Number(this.dataCalculatrice.value.selectedTab === 'vacation' ? this.dataCalculatrice.value.vacation.unit : 0)
    let cat = 'Magistrat'

    switch (categoryId) {
      case '1':
        cat = 'Magistrat'
        break
      case '2':
        cat = 'Fonctionnaire'
        break
      case '3':
        cat = 'Fonctionnaire'
        break
    }

    const nbHoursPerDay = 'nbHoursPerDayAnd' + cat
    const byDayAndCat = 'nbDaysBy' + cat

    if (cat === 'Fonctionnaire' && this.dataCalculatrice.value.selectedTab === 'vacation') {
      return ((value / basicEtptData[nbHoursPerDay]) * unit * periodicData[cat][option]) / basicEtptData[byDayAndCat]
    }
    if (cat === 'Magistrat' && this.dataCalculatrice.value.selectedTab === 'vacation') {
      return ((unit / basicEtptData[nbHoursPerDay]) * value * periodicData[cat][option]) / basicEtptData[byDayAndCat]
    } else {
      return (value * periodicData[cat][option]) / (periodicData[cat]['jour'] * basicEtptData[nbHoursPerDay])
    }
  }

  /**
   * Méthode pour vérifier si la calculatrice est calculable
   * @param cat
   * @param fonc
   * @returns
   */
  isCalculable(cat: number | null = null, fonc: number | null = null) {
    if (cat && fonc) {
      return true
    }
    return false
  }
}

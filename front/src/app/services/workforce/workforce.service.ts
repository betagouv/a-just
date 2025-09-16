import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { FilterPanelInterface } from '../../routes/workforce/filter-panel/filter-panel.component'

/**
 * Service de sauvegarde des filtres de la page ventilateur
 */
@Injectable({
  providedIn: 'root',
})
export class WorkforceService {
  /**
   * Date sélectionnée en cache
   */
  dateSelected: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date())
  /**
   * Filtres sélectionnée en cache
   */
  filterParams: FilterPanelInterface | null = null
}

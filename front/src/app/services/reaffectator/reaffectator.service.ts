import { Injectable } from '@angular/core'
import { setTimeToMidDay } from 'src/app/utils/dates'
import { ServerService } from '../http-server/server.service'

/**
 * Service de la page du réaffectateur
 */
@Injectable({
  providedIn: 'root',
})
export class ReaffectatorService {
  /**
   * Liste des référentiels sélectionnés et mise en cache
   */
  selectedReferentielIds: number[] = []
  /**
   * Liste des catégories sélectionnées et mise en cache
   */
  selectedCategoriesId: number | null = null
  /**
   * Liste des fonctions sélectionnées et mise en cache
   */
  selectedFonctionsIds: number[] = []

  /**
   * Constructeur
   * @param serverService 
   */
  constructor(private serverService: ServerService) {}

  /**
   * API Appel au serveur pour lister les fiches d'une juridiction par catégorie
   * @param backupId 
   * @param date 
   * @param categoryId 
   * @param fonctionsIds 
   * @param referentielList 
   * @returns 
   */
  onFilterList(
    backupId: number,
    date: Date,
    categoryId: number,
    fonctionsIds: number[] | null,
    referentielList: number[] | null
  ) {
    return this.serverService
      .post(`reaffectator/filter-list`, {
        backupId,
        date: setTimeToMidDay(date),
        categoryId,
        fonctionsIds,
        referentielList,
      })
      .then((data) => {
        return data.data
      })
  }
}

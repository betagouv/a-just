import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';
import { HRFonctionInterface } from '../../interfaces/hr-fonction';

/**
 * Service de listing des fonctions
 * Exemple président, 1VP,...
 */
@Injectable({
  providedIn: 'root',
})
export class HRFonctionService {
  /**
   * Liste mise en cache
   */
  fonctions: HRFonctionInterface[] = [];

  /**
   * Constructeur
   * @param serverService
   */
  constructor(private serverService: ServerService) {}

  /**
   * API récupération de la liste complète
   * Et si c'est en cache ne pas faire d'appel
   * @returns
   */
  getAll(): Promise<HRFonctionInterface[]> {
    if (this.fonctions.length) {
      return new Promise((resolve) => {
        resolve(this.fonctions);
      });
    }

    return this.serverService
      .get('hr-fonctions/get-all')
      .then((r) => r.data || [])
      .then((list) => {
        this.fonctions = list;
        return list;
      });
  }
}

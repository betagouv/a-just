import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';
import { BehaviorSubject } from 'rxjs';
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel';
import { BackupInterface } from '../../interfaces/backup';
import { HRFonctionInterface } from '../../interfaces/hr-fonction';
import { HRCategoryInterface } from '../../interfaces/hr-category';

@Injectable({
  providedIn: 'root',
})
export class HumanResourceService {
  /**
   * Liste des contentieux uniquement
   */
  contentieuxReferentielOnly: BehaviorSubject<
    ContentieuReferentielInterface[]
  > = new BehaviorSubject<ContentieuReferentielInterface[]>([]);
  /**
   * Liste des juridictions dont à accès l'utilisateur
   */
  backups: BehaviorSubject<BackupInterface[]> = new BehaviorSubject<
    BackupInterface[]
  >([]);
  /**
   * Liste des catégories sélectionnée dans l'écran du ventilateur en cache
   */
  categoriesFilterListIds: number[] = [];
  /**
   * Liste des fonctions
   */
  fonctions: BehaviorSubject<HRFonctionInterface[]> = new BehaviorSubject<
    HRFonctionInterface[]
  >([]);
  /**
   * Liste des catégories
   */
  categories: BehaviorSubject<HRCategoryInterface[]> = new BehaviorSubject<
    HRCategoryInterface[]
  >([]);
  /**
   * Liste des contentieux + soutien + indispo
   */
  contentieuxReferentiel: BehaviorSubject<ContentieuReferentielInterface[]> =
    new BehaviorSubject<ContentieuReferentielInterface[]>([]);
  /**
   * Liste du référentiels des indispos
   */
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = [];
  /**
   * Liste des id du référentiels des indispos
   */
  allIndisponibilityReferentielIds: Array<number> = [];
  /**
   * Liste des référentiels sélectionnée dans l'écran du ventilateur en cache
   */
  selectedReferentielIds: number[] = [];

  constructor(private serverService: ServerService) {}

  getBackupList() {
    return this.serverService
      .get('human-resources/get-backup-list')
      .then((r) => r.data || []);
  }
}

import { Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'

@Injectable({
  providedIn: 'root',
})
export class ReaffectatorService {
  selectedReferentielIds: number[] = []
  selectedCategoriesId: number | null = null
  selectedFonctionsIds: number[] = []

  constructor(private serverService: ServerService) {}

  onFilterList(
    backupId: number,
    date: Date,
    categoryId: number,
    fonctionsIds: number[],
    referentielList: number[] | null
  ) {
    return this.serverService
      .post(`reaffectator/filter-list`, {
        backupId,
        date,
        categoryId,
        fonctionsIds,
        referentielList,
      })
      .then((data) => {
        return data.data
      })
  }
}

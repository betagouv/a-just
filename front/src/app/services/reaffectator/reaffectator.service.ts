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
    contentieuxIds: number[] | null,
    categoryId: number,
    fonctionsIds: number[]
  ) {
    return this.serverService
      .post(`reaffectator/filter-list`, {
        backupId,
        date,
        contentieuxIds,
        categoryId,
        fonctionsIds,
      })
      .then((data) => {
        return data.data
      })
  }
}

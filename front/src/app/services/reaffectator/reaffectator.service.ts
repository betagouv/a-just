import { Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'

@Injectable({
  providedIn: 'root',
})
export class ReaffectatorService {
  selectedReferentielIds: number[] = []
  selectedCategoriesIds: number[] = []
  selectedFonctionsIds: number[] = []

  constructor(private serverService: ServerService) {}

  onFilterList(
    backupId: number,
    date: Date,
    contentieuxIds: number[],
    categoriesIds: number[],
    fonctionsIds: number[]
  ) {
    return this.serverService
      .post(`reaffectator/filter-list`, {
        backupId,
        date,
        contentieuxIds,
        categoriesIds,
        fonctionsIds,
      })
      .then((data) => {
        return data.data.list
      })
  }
}

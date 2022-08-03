import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class ReaffectatorService {
  selectedReferentielIds: number[] = []
  selectedCategoriesIds: number[] = []
  selectedFonctionsIds: number[] = []
}

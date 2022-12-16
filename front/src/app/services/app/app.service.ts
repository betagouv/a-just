import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { AlertInterface } from 'src/app/interfaces/alert'

/**
 * Service d'outil généraux qui concerne l'APP, chez nous ce n'est que l'alerte
 */

@Injectable({
  providedIn: 'root',
})
export class AppService {
  /**
   * Mettre à mettre en alert
   */
  alert: BehaviorSubject<AlertInterface | null> = new BehaviorSubject<AlertInterface | null>(
    null
  )
}

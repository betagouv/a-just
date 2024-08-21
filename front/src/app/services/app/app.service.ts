import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { AlertInterface } from 'src/app/interfaces/alert'

declare const toastr: any

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
  alert: BehaviorSubject<AlertInterface | null> =
    new BehaviorSubject<AlertInterface | null>(null)
  /**
   * Cache previous URL
   */
  previousUrl: string | null = null
  /**
   * Cache current URL
   */
  currentUrl: string | null = null
  /**
   * Mettre à mettre en alert
   */
  tooltipsOpenId: BehaviorSubject<string | null> = new BehaviorSubject<
    string | null
  >(null)
  /**
   * Mettre un grand loader
   */
  appLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  constructor() {
    this.initToastrConfig()
  }

  initToastrConfig() {
    toastr.options = {
      closeButton: false,
      debug: false,
      newestOnTop: false,
      progressBar: false,
      positionClass: 'toast-top-center',
      preventDuplicates: false,
      onclick: null,
      showDuration: '300',
      hideDuration: '1000',
      timeOut: '5000',
      extendedTimeOut: '1000',
      showEasing: 'swing',
      hideEasing: 'linear',
      showMethod: 'fadeIn',
      hideMethod: 'fadeOut',
    }
  }

  notification(message: string) {
    toastr.warning(message)
  }
}

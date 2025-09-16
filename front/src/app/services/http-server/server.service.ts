import { inject, Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { BehaviorSubject } from 'rxjs'

/**
 * Service de communication avec le serveur
 */
@Injectable({
  providedIn: 'root',
})
export class ServerService {
  /**
   * Service de communication avec le serveur
   */
  _http = inject(HttpService)
  /**
   * Token de l'utilisateur
   */
  userToken: BehaviorSubject<any> = new BehaviorSubject<any>(null)
  /**
   * URL du serveur
   */
  serverUrl: string = import.meta.env.NG_APP_SERVER_URL

  /**
   * Préformatage des retours
   * @param url
   * @returns
   */
  getUrl(url: string): string {
    return this.serverUrl + url
  }

  /**
   * Gestion des erreurs
   * @param error
   * @returns
   */
  handleError(error: any) {
    //this.appService.setIsLoading(false);
    console.log('handleError', error)
    if (error.status) {
      console.log('error.status', error.status)
    }
    if (error.toString) {
      console.log('error.toString', error.toString())
    }

    if (error.status === 403) {
      localStorage.removeItem('token')
      window.location.href = '/'
      alert('Veuillez vous reconnecter')
      return Promise.reject('Veuillez vous reconnecter')
    } else if (error.status === 404) {
      alert('Connexion au serveur impossible. Veuillez réessayer dans quelques minutes.')
      return Promise.reject('Connexion au serveur impossible. Veuillez réessayer dans quelques minutes.')
    } else if (error.status === undefined) {
      alert(error.toString())
      return Promise.reject(error.toString())
    } else {
      const defaultErrorText = 'Connexion au serveur impossible. Veuillez réessayer dans quelques minutes.'
      let err = error.error || error.statusText || defaultErrorText
      if (err === 'error' || typeof err !== 'string') {
        err = defaultErrorText
      }

      alert(err)
      return Promise.reject(err)
    }
  }

  /* TOKEN */
  getToken(): any {
    if (this.userToken.getValue() == null) {
      try {
        if (localStorage && localStorage.getItem('token')) {
          this.setToken(localStorage.getItem('token'))
        }
      } catch (err) {}
    }

    return this.userToken.getValue()
  }
  /**
   * Définition du token
   * @param t
   */
  setToken(t: string | null): void {
    this.userToken.next(t)
    localStorage.setItem('token', '' + t)
  }

  /**
   * Suppression du token
   */
  removeToken() {
    this.userToken.next(null)
    localStorage.removeItem('token')
  }

  /* HTTPs request */
  get(url: string, options = {}): Promise<any> {
    console.log('HTTP GET ' + this.getUrl(url))
    //this.appService.setIsLoading(true);
    return this._http
      .get(this.getUrl(url), options)
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r
      })
      .catch(this.handleError)
  }
  /**
   * GET sans retour des erreurs
   * @param url
   * @param options
   * @returns
   */
  getWithoutError(url: string, options = {}): Promise<any> {
    console.log('HTTP GET ' + this.getUrl(url))
    return this._http.get(this.getUrl(url), options).then((r) => {
      //this.appService.setIsLoading(false);
      return r
    })
  }

  /**
   * POST
   * @param url
   * @param params
   * @param options
   * @param header
   * @returns
   */
  post(url: string, params = {}, options = {}, header = {}): Promise<any> {
    console.log('HTTP POST ' + this.getUrl(url))
    return this._http
      .post(this.getUrl(url), params, options)
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r
      })
      .catch(this.handleError)
  }

  /**
   * POST sans retour des erreurs
   * @param url
   * @param params
   * @param options
   * @returns
   */
  postWithoutError(url: string, params = {}, options = {}): Promise<any> {
    console.log('HTTP GET ' + this.getUrl(url))
    return this._http.post(this.getUrl(url), params, options).then((r) => {
      //this.appService.setIsLoading(false);
      return r
    })
  }

  /**
   * PUT
   * @param url
   * @param params
   * @param options
   * @returns
   */
  put(url: string, params = {}, options = {}): Promise<any> {
    console.log('HTTP PUT ' + this.getUrl(url))
    return this._http
      .put(this.getUrl(url), params, options)
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r
      })
      .catch(this.handleError)
  }

  /**
   * DELETE
   * @param url
   * @param options
   * @returns
   */
  delete(url: string, options = {}): Promise<any> {
    console.log('HTTP DELETE ' + this.getUrl(url))
    return this._http
      .delete(this.getUrl(url), options)
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r
      })
      .catch(this.handleError)
  }
}

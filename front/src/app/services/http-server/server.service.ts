import { Injectable } from '@angular/core'
import { HttpHeaders } from '@angular/common/http'
import { environment } from '../../../environments/environment'
import { HttpService } from './http.service'
import { BehaviorSubject } from 'rxjs'

/**
 * Service d'ajout et formation des headers des appels serveur
 */
@Injectable({
  providedIn: 'root',
})
export class ServerService {
  /**
   * Token d'identification utilisateur fourni par le serveur
   */
  userToken: BehaviorSubject<any> = new BehaviorSubject<any>(null)
  /**
   * L'adresse du serveur
   */
  serverUrl: string = environment.serverUrl

  /**
   * Constructeur
   * @param _http 
   */
  constructor(private _http: HttpService) {}

  /**
   * Concaténation d'un chemin serveur avec l'adresse du serveur
   * @param url 
   * @returns 
   */
  getUrl(url: string): string {
    return this.serverUrl + url
  }

  /**
   * Auto remplissage du header pour les appels serveurs
   * @returns 
   */
  getOptions() {
    const json = { 'Content-Type': 'application/json', Authorization: '' }
    const token = this.getToken()
    if (token) {
      json.Authorization = token
    }
    const headers = new HttpHeaders(json)

    return { headers: headers }
  }

  /**
   * Control des erreurs serveurs et de leurs impacts sur l'utilisateur
   * @param error 
   * @returns 
   */
  handleError(error: any) {
    console.log('handleError', error)
    if (error.status) {
      console.log('error.status', error.status)
    }
    if (error.toString) {
      console.log('error.toString', error.toString())
    }

    if (error.status === 403) {
      window.location.href = '/'
      alert('Vous n\'avez pas accès à cette section !')
      return Promise.reject('Vous n\'avez pas accès à cette section !')
    } else if (error.status === 404) {
      alert(
        'Connexion au serveur impossible. Veuillez réessayer dans quelques minutes.'
      )
      return Promise.reject(
        'Connexion au serveur impossible. Veuillez réessayer dans quelques minutes.'
      )
    } else if (error.status === undefined) {
      alert(error.toString())
      return Promise.reject(error.toString())
    } else {
      const defaultErrorText =
        'Connexion au serveur impossible. Veuillez réessayer dans quelques minutes.'
      let err = error.error || error.statusText || defaultErrorText
      if (err === 'error' || typeof err !== 'string') {
        err = defaultErrorText
      }

      alert(err)
      return Promise.reject(err)
    }
  }

  /**
   * Récuparation du token depuis le localStorage s'il y a
   * @returns 
   */
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
   * Mise à jour du token utilisateur dans le localStorage
   * @param t 
   */
  setToken(t: string | null): void {
    this.userToken.next(t)
    localStorage.setItem('token', '' + t)
  }

  /**
   * Suppréssion du token, souvant quand logout ou token expiré
   */
  removeToken() {
    this.userToken.next(null)
    localStorage.removeItem('token')
  }

  /**
   * Préparation du GET avec le bon header + réponse adaptée
   * @param url 
   * @param options 
   * @returns 
   */
  get(url: string, options = {}): Promise<any> {
    console.log('HTTP GET ' + this.getUrl(url))
    return this._http
      .get(this.getUrl(url), { ...this.getOptions(), ...options })
      .catch(this.handleError)
  }

  /**
   * Préparation du GET avec le bon header + réponse adaptée
   * @param url 
   * @param options 
   * @returns 
   */
  getFile(url: string, options = {}): Promise<any> {
    console.log('HTTP GET ' + this.getUrl(url))
    return this._http
      .get(this.getUrl(url), { ...this.getOptions(), ...options })
      .catch(this.handleError)
  }

  /**
   * Préparation du GET avec le bon header + réponse adaptée SANS message d'erreur
   * @param url 
   * @param options 
   * @returns 
   */
  getWithoutError(url: string, options = {}): Promise<any> {
    console.log('HTTP GET ' + this.getUrl(url))
    return this._http.get(this.getUrl(url), {
      ...this.getOptions(),
      ...options,
    })
  }

  /**
   * Préparation du POST avec le bon header + réponse adaptée
   * @param url 
   * @param params 
   * @param options 
   * @returns 
   */
  post(url: string, params = {}, options = {}): Promise<any> {
    console.log('HTTP POST ' + this.getUrl(url))
    return this._http
      .post(this.getUrl(url), params, { ...this.getOptions(), ...options })
      .catch(this.handleError)
  }

  /**
   * Préparation du POST avec le bon header + réponse adaptée SANS message d'erreur
   * @param url 
   * @param params 
   * @param options 
   * @returns 
   */
  postWithoutError(url: string, params = {}, options = {}): Promise<any> {
    console.log('HTTP GET ' + this.getUrl(url))
    return this._http.post(this.getUrl(url), params, {
      ...this.getOptions(),
      ...options,
    })
  }

  /**
   * Préparation du PUT avec le bon header + réponse adaptée
   * @param url 
   * @param params 
   * @param options 
   * @returns 
   */
  put(url: string, params = {}, options = {}): Promise<any> {
    console.log('HTTP PUT ' + this.getUrl(url))
    return this._http
      .put(this.getUrl(url), params, { ...this.getOptions(), ...options })
      .catch(this.handleError)
  }

  /**
   * Préparation du DELETE avec le bon header + réponse adaptée
   * @param url 
   * @param params 
   * @param options 
   * @returns 
   */
  delete(url: string, options = {}): Promise<any> {
    console.log('HTTP DELETE ' + this.getUrl(url))
    return this._http
      .delete(this.getUrl(url), { ...this.getOptions(), ...options })
      .catch(this.handleError)
  }
}

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Service de simplification des appels à un serveur
 */

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  _http = inject(HttpClient);

  /**
   * Préformatage des retours
   * @param val
   * @returns
   */
  consoleResult(val: any) {
    return val;
  }

  /**
   * Transformation d'un GET observable en promise
   * @param url
   * @param options
   * @returns
   */
  get(url: string, options = {}): Promise<any> {
    return this._http.get(url, options).toPromise().then(this.consoleResult);
  }

  /**
   * Transformation d'un POST observable en promise
   * @param url
   * @param params
   * @param options
   * @returns
   */
  post(url: string, params = {}, options = {}): Promise<any> {
    return this._http
      .post(url, params, options)
      .toPromise()
      .then(this.consoleResult);
  }

  /**
   * Transformation d'un PUT observable en promise
   * @param url
   * @param params
   * @param options
   * @returns
   */
  put(url: string, params = {}, options = {}): Promise<any> {
    return this._http
      .put(url, params, options)
      .toPromise()
      .then(this.consoleResult);
  }

  /**
   * Transformation d'un DELETE observable en promise
   * @param url
   * @param options
   * @returns
   */
  delete(url: string, options = {}): Promise<any> {
    return this._http.delete(url, options).toPromise();
  }
}

import { Injectable } from '@angular/core';

import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { HttpService } from './http.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  userToken: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  serverUrl: string = environment.serverUrl;

  constructor(private _http: HttpService/*, private appService: AppService*/) {}

  getUrl(url: string): string {
    return this.serverUrl + url;
  }

  getOptions(header = {}) {
    const json = {
      'Content-Type': 'application/json',
      Authorization: '',
      ...header,
    };
    const token = this.getToken();
    if (token) {
      json.Authorization = token;
    }
    const headers = new HttpHeaders(json);

    return { headers: headers };
  }

  handleError(error: any) {
    //this.appService.setIsLoading(false);
    console.log('handleError', error);
    if (error.status) {
      console.log('error.status', error.status);
    }
    if (error.toString) {
      console.log('error.toString', error.toString());
    }

    if (error.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/';
      alert('Veuillez vous reconnecter');
      return Promise.reject('Veuillez vous reconnecter');
    } else if (error.status === 404) {
      alert(
        'Connexion au serveur impossible. Veuillez réessayer dans quelques minutes.'
      );
      return Promise.reject(
        'Connexion au serveur impossible. Veuillez réessayer dans quelques minutes.'
      );
    } else if (error.status === undefined) {
      alert(error.toString());
      return Promise.reject(error.toString());
    } else {
      const defaultErrorText =
        'Connexion au serveur impossible. Veuillez réessayer dans quelques minutes.';
      let err = error.error || error.statusText || defaultErrorText;
      if (err === 'error' || typeof err !== 'string') {
        err = defaultErrorText;
      }

      alert(err);
      return Promise.reject(err);
    }
  }

  /* TOKEN */
  getToken(): any {
    if (this.userToken.getValue() == null) {
      try {
        if (localStorage && localStorage.getItem('token')) {
          this.setToken(localStorage.getItem('token'));
        }
      } catch (err) {}
    }

    return this.userToken.getValue();
  }

  setToken(t: string | null): void {
    this.userToken.next(t);
    localStorage.setItem('token', '' + t);
  }

  removeToken() {
    this.userToken.next(null);
    localStorage.removeItem('token');
  }

  /* HTTPs request */
  get(url: string, options = {}): Promise<any> {
    console.log('HTTP GET ' + this.getUrl(url));
    //this.appService.setIsLoading(true);
    return this._http
      .get(this.getUrl(url), { ...this.getOptions(), ...options })
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r;
      })
      .catch(this.handleError);
  }

  getWithoutError(url: string, options = {}): Promise<any> {
    console.log('HTTP GET ' + this.getUrl(url));
    return this._http
      .get(this.getUrl(url), {
        ...this.getOptions(),
        ...options,
      })
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r;
      });
  }

  post(url: string, params = {}, options = {}, header = {}): Promise<any> {
    console.log('HTTP POST ' + this.getUrl(url));
    return this._http
      .post(this.getUrl(url), params, {
        ...this.getOptions(header),
        ...options,
      })
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r;
      })
      .catch(this.handleError);
  }

  postWithoutError(url: string, params = {}, options = {}): Promise<any> {
    console.log('HTTP GET ' + this.getUrl(url));
    return this._http
      .post(this.getUrl(url), params, {
        ...this.getOptions(),
        ...options,
      })
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r;
      });
  }

  put(url: string, params = {}, options = {}): Promise<any> {
    console.log('HTTP PUT ' + this.getUrl(url));
    return this._http
      .put(this.getUrl(url), params, { ...this.getOptions(), ...options })
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r;
      })
      .catch(this.handleError);
  }

  delete(url: string, options = {}): Promise<any> {
    console.log('HTTP DELETE ' + this.getUrl(url));
    return this._http
      .delete(this.getUrl(url), { ...this.getOptions(), ...options })
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r;
      })
      .catch(this.handleError);
  }
}

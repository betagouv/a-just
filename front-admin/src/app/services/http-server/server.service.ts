import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  _http = inject(HttpService);
  userToken: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  handleError(error: any) {
    //this.appService.setIsLoading(false);
    console.error('handleError', error);
    if (error.status) {
      console.error('error.status', error.status);
    }
    if (error.toString) {
      console.error('error.toString', error.toString());
    }

    if (error.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/';
      alert('Veuillez vous reconnecter');
      return Promise.reject('Veuillez vous reconnecter');
    } else if (error.status === 404) {
      alert(
        'Connexion au serveur impossible. Veuillez réessayer dans quelques minutes.',
      );
      return Promise.reject(
        'Connexion au serveur impossible. Veuillez réessayer dans quelques minutes.',
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
  async get(url: string, options = {}): Promise<any> {
    //this.appService.setIsLoading(true);
    return this._http
      .get(url, options)
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r;
      })
      .catch(this.handleError);
  }

  async getWithoutError(url: string, options = {}): Promise<any> {
    return this._http.get(url, options).then((r) => {
      //this.appService.setIsLoading(false);
      return r;
    });
  }

  async post(
    url: string,
    params = {},
    options = {},
    header = {},
  ): Promise<any> {
    //console.log('HTTP POST ' + url);
    return this._http
      .post(url, params, options)
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r;
      })
      .catch(this.handleError);
  }

  async postWithoutError(url: string, params = {}, options = {}): Promise<any> {
    return this._http.post(url, params, options).then((r) => {
      //this.appService.setIsLoading(false);
      return r;
    });
  }

  async put(url: string, params = {}, options = {}): Promise<any> {
    //console.log('HTTP PUT ' + url);
    return this._http
      .put(url, params, options)
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r;
      })
      .catch(this.handleError);
  }

  async putWithoutError(url: string, params = {}, options = {}): Promise<any> {
    return this._http.put(url, params, options).then((r) => {
      //this.appService.setIsLoading(false);
      return r;
    });
  }

  async delete(url: string, options = {}): Promise<any> {
    //console.log('HTTP DELETE ' + url);
    return this._http
      .delete(url, options)
      .then((r) => {
        //this.appService.setIsLoading(false);
        return r;
      })
      .catch(this.handleError);
  }
}

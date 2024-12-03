import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  _http = inject(HttpClient);

  consoleResult(val: any) {
    return val;
  }

  /* HTTPs request */
  get(url: string, options = {}): Promise<any> {
    return this._http.get(url, options).toPromise().then(this.consoleResult);
  }

  post(url: string, params = {}, options = {}): Promise<any> {
    return this._http
      .post(url, params, options)
      .toPromise()
      .then(this.consoleResult);
  }

  put(url: string, params = {}, options = {}): Promise<any> {
    return this._http
      .put(url, params, options)
      .toPromise()
      .then(this.consoleResult);
  }

  delete(url: string, options = {}): Promise<any> {
    return this._http.delete(url, options).toPromise();
  }
}

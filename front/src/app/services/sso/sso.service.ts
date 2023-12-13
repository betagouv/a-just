import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';

/**
 * Service en lien avec le SSO
 */
@Injectable({
  providedIn: 'root',
})
export class SSOService {
  /**
   * URL du serveur SSO
   */
  redirectUrl: string = '';

  /**
   * Constructeur
   * @param serverService 
   */
  constructor(
    private serverService: ServerService
  ) {}

  /**
   * API vérification si un utilisateur est connecté sans message d'erreur
   * @returns 
   */
  serverHaveSSO() {
    return this.serverService
      .get('sso/is-ready')
      .then((data) => {
        if(data.success) {
          this.redirectUrl = data.url
          return true
        }

        return false
      });
  }

  /**
   * API to test client SSO
   */
  
}

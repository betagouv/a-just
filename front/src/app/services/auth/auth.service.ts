import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';
import { UserService } from '../user/user.service';

/**
 * Service en lien avec l'authentification
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * URL de redirection si quelqu'un cherche à accéder à une page mais n'est pas connecté
   */
  redirectUrl: string = '';

  /**
   * Constructeur
   * @param serverService 
   * @param userService 
   */
  constructor(
    private serverService: ServerService,
    private userService: UserService
  ) {}

  /**
   * Retour si un utilisateur est connecté
   * @returns 
   */
  async userConnected() {
    const jwToken = this.serverService.getToken();
    const tmpUser = this.userService.user.getValue();
    if (tmpUser) {
      return tmpUser;
    } else {
      try {
        const http = await this.userInfosWithoutError();
        if (jwToken == null || !http.user) {
          this.userService.setUser(null);
          return null;
        }

        this.userService.setUser(http.user);
        return http.user;
      } catch (err) {
        return null;
      }
    }
  }

  /**
   * API retourne les informations rapide d'un utilisateur connecté
   * @returns 
   */
  userInfos() {
    return this.serverService.get('auths/auto-login').then((data) => {
      return data;
    });
  }

  /**
   * API vérification si un utilisateur est connecté sans message d'erreur
   * @returns 
   */
  userInfosWithoutError() {
    return this.serverService
      .getWithoutError('auths/auto-login')
      .then((data) => {
        return data;
      });
  }

  /**
   * API Tentative de connexion
   * @param params 
   * @returns 
   */
  async login(params = {}, options = {}): Promise<any> {
    return this.serverService.post('auths/login', params, options).then((data) => {
      this.serverService.setToken(data.token);
      return data;
    });
  }

  /**
   * API Control auth 2FA
   * @param params 
   * @returns 
   */
  completeLogin(params = {}, options = {}): Promise<any> {
    return this.serverService.post('auths/complete-login', params, options).then((data) => {
      this.serverService.setToken(data.token);
      return data;
    });
  }

  /**
   * Déconnection d'un utilisateur
   * @returns 
   */
  onLogout() {
    return this.userService.logout();
  }
}

import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  redirectUrl: string = '';

  constructor(
    private serverService: ServerService,
    private userService: UserService
  ) { }

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

  async userAdminConnected() {
    const jwToken = this.serverService.getToken();
    const tmpUser = this.userService.user.getValue();
    if (tmpUser) {
      return tmpUser;
    } else {
      try {
        const http = await this.userAdminInfosWithoutError();
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

  userInfos() {
    return this.serverService.get('auths/auto-login').then((data) => {
      return data;
    });
  }

  userInfosWithoutError() {
    return this.serverService
      .getWithoutError('auths/auto-login')
      .then((data) => {
        return data;
      });
  }

  userAdminInfosWithoutError() {
    return this.serverService
      .getWithoutError('auths/auto-login-admin')
      .then((data) => {
        return data;
      });
  }

  login(params = {}): Promise<any> {
    return this.serverService.post('auths/login', params).then((data) => {
      this.serverService.setToken(data.token);
      return true;
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

  loginAdmin(params = {}): Promise<any> {
    return this.serverService.post('auths/login-admin', params).then((data) => {
      this.serverService.setToken(data.token);
      return data;
    });
  }

  onLogout() {
    return this.userService.logout();
  }
}

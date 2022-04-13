import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { UserInterface } from 'src/app/interfaces/user-interface'
import { ServerService } from '../http-server/server.service'

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: BehaviorSubject<UserInterface | null> = new BehaviorSubject<UserInterface | null>(null);

  constructor (
    private serverService: ServerService
  ) {}

  setUser (user: UserInterface | null) {
    this.user.next(user)

    if (user && user.token) {
      this.serverService.setToken(user.token)
    }
  }

  me () {
    return this.serverService.get('users/me').then((data) => data.data || null);
  }

  register(params = {}): Promise<any> {
    return this.serverService.post('users/create-account', params).then((data) => data.data || null);
  }

  forgotPassword(params = {}): Promise<any> {
    return this.serverService.post('users/forgot-password', params).then((data) => data.data || null);
  }

  logout () {
    return this.serverService.get('auths/logout').then(() => {
      this.user.next(null);
      this.serverService.removeToken();
    });
  }

  isAdmin () {
    const user = this.user.getValue();
    if(user && user.role === 1) {
      return true;
    } else {
      return false;
    }
  }
}

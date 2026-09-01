import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ServerService } from '../http-server/server.service';
import { UserInterface } from '../../interfaces/user-interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: BehaviorSubject<UserInterface | null> =
    new BehaviorSubject<UserInterface | null>(null);

  constructor(private serverService: ServerService) {}

  setUser(user: UserInterface | null) {
    this.user.next(user);
  }

  async me() {
    return this.serverService.get('users/me').then((data) => data.data || null);
  }

  async register(params = {}): Promise<any> {
    return this.serverService
      .post('users/create-account', params)
      .then((data) => data.data || null);
  }

  async logout() {
    return this.serverService.get('auths/logout').then(() => {
      this.user.next(null);
      this.serverService.removeToken();
    });
  }

  async getAll() {
    return this.serverService
      .get('users/get-all')
      .then((data) => data.data || []);
  }

  async updateUser(params = {}): Promise<any> {
    return this.serverService.post('users/update-account', params);
  }

  async deleteUser(userId: number): Promise<any> {
    return this.serverService.delete(`users/remove-account/${userId}`);
  }
}

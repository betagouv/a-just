import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { BackupInterface } from 'src/app/interfaces/backup'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { UserInterface } from 'src/app/interfaces/user-interface'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { ReferentielService } from '../referentiel/referentiel.service'

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: BehaviorSubject<UserInterface | null> =
    new BehaviorSubject<UserInterface | null>(null)

  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
  ) {}

  setUser(user: UserInterface | null) {
    this.user.next(user)

    if (user && user.token) {
      this.serverService.setToken(user.token)

      this.initDatas()
    }
  }

  me() {
    return this.serverService.get('users/me').then((data) => data.data || null)
  }

  register(params = {}): Promise<any> {
    return this.serverService
      .post('users/create-account', params)
      .then((data) => data.data || null)
  }

  forgotPassword(params = {}): Promise<any> {
    return this.serverService
      .post('users/forgot-password', params)
      .then((data) => data.data || null)
  }

  changePassword(params = {}): Promise<any> {
    return this.serverService
      .post('users/change-password', params)
      .then((data) => data.data || null)
  }

  logout() {
    return this.serverService.get('auths/logout').then(() => {
      this.user.next(null)
      this.serverService.removeToken()
    })
  }

  isAdmin() {
    const user = this.user.getValue()
    if (user && user.role === 1) {
      return true
    } else {
      return false
    }
  }

  getInitDatas() {
    return this.serverService
      .get('users/get-user-datas')
      .then((data) => data.data || null)
  }

  initDatas() {
    this.getInitDatas().then((result) => {
      this.humanResourceService.categoriesFilterListIds = result.categories.map(
        (c: HRCategoryInterface) => c.id
      )
      this.humanResourceService.categories.next(result.categories)
      this.humanResourceService.fonctions.next(result.fonctions)
      this.referentielService.formatDatas(result.referentiel)
      this.humanResourceService.backups.next(
        result.backups.map((b: BackupInterface) => ({
          ...b,
          date: new Date(b.date),
        }))
      )
    })
  }
}

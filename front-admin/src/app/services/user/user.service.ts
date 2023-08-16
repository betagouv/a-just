import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { UserInterface } from 'src/app/interfaces/user-interface'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { ReferentielService } from '../referentiel/referentiel.service'  
import { BackupInterface } from 'src/app/interfaces/backup'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category' 
@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: BehaviorSubject<UserInterface | null> = new BehaviorSubject<UserInterface | null>(null);

  constructor (
    private serverService: ServerService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService
  ) {}

  setUser (user: UserInterface | null) {
    this.user.next(user)
  
    if (user) {
      this.initDatas()
    }
  }

  me () {
    return this.serverService.get('users/me').then((data) => data.data || null);
  }

  register(params = {}): Promise<any> {
    return this.serverService.post('users/create-account', params).then((data) => data.data || null);
  }

  logout () {
    return this.serverService.get('auths/logout').then(() => {
      this.user.next(null);
      this.serverService.removeToken();
    });
  }

  getAll() {
    return this.serverService.get('users/get-all').then((data) => data.data || []);
  }

  updateUser(params = {}): Promise<any> {
    return this.serverService.post('users/update-account', params);
  }

  deleteUser(userId: number) : Promise<any> {
    return this.serverService.delete(`users/remove-account/${userId}`)
  }

    /**
   * API demande des informations générale
   * @returns
   */
    getInitDatas() {
      return this.serverService
        .get('users/get-user-datas')
        .then((data) => data.data || null)
    }

    /**
   * Traitement des informations générales comme les catégories, fonctions, juridictions dispo et référentiel
   */
    initDatas() {
      this.getInitDatas().then((result) => {
        this.humanResourceService.categoriesFilterListIds = result.categories.map(
          (c: HRCategoryInterface) => c.id
        )
        this.humanResourceService.fonctions.next(result.fonctions)
        this.humanResourceService.categories.next(result.categories)
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

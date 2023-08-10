import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { BackupInterface } from 'src/app/interfaces/backup'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { UserInterface } from 'src/app/interfaces/user-interface'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { ReferentielService } from '../referentiel/referentiel.service'
import { USER_ACCESS_ACTIVITIES, USER_ACCESS_AVERAGE_TIME, USER_ACCESS_CALCULATOR, USER_ACCESS_SIMULATOR, USER_ACCESS_VENTILATIONS } from 'src/app/constants/user-access'

/**
 * Service de sauvegarde de l'utilisateur actuel
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  /**
   * Format de l'utilisateur connecté
   */
  user: BehaviorSubject<UserInterface | null> =
    new BehaviorSubject<UserInterface | null>(null)

  /**
   * Interface front TJ ou CA
   */
  interfaceType: number | null = null

  /**
   * Constructeur
   * @param serverService
   * @param humanResourceService
   * @param referentielService
   */
  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService
  ) { }

  /**
   * Sauvegarde d'une utilisateur
   * @param user
   */
  setUser(user: UserInterface | null) {
    this.user.next(user)

    if (user && user.token) {
      this.serverService.setToken(user.token)

      this.initDatas()
    }
  }

  /**
   * Get process variables
   * @returns 
   */
  getInterfaceType() {
    return this.serverService.get('users/interface-type').then((data) => {
      this.interfaceType = [0, 1].includes(+data.data) ? +data.data : null;
      console.log(this.interfaceType)
    })
  }

  /**
   * API Identification de qui est l'utilisateur connecté
   * @returns
   */
  me() {
    return this.serverService.getWithoutError('users/me').then((data) => data.data || null)
  }

  /**
   * API Inscription d'un nouveau utilisateur
   * @param params
   * @returns
   */
  register(params = {}): Promise<any> {
    return this.serverService
      .post('users/create-account', params)
      .then((data) => data.data || null)
  }

  /**
   * API demande de nouveau mot de passe
   * @param params
   * @returns
   */
  forgotPassword(params = {}): Promise<any> {
    return this.serverService
      .post('users/forgot-password', params)
      .then((data) => data.data || null)
  }

  /**
   * API changement du mot de passe avec code
   * @param params
   * @returns
   */
  changePassword(params = {}): Promise<any> {
    return this.serverService
      .post('users/change-password', params)
      .then((data) => data.data || null)
  }

  /**
   * API Logout avec suppression du token coté serveur
   * @returns
   */
  logout() {
    return this.serverService.get('auths/logout').then(() => {
      this.user.next(null)
      this.serverService.removeToken()
    })
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

  /**
   * Retourne la page d'accès d'un utilisateur
   */
  getUserPageUrl(user: UserInterface) {
    if (user) {
      const allPages = this.getAllUserPageUrl(user)
      if (allPages) {
        return `/${allPages[0].path}`
      }
    }

    return ''
  }

  /**
   * Can view Ventilations
   */
  canViewVentilation(user: UserInterface | null = null) {
    user = user || this.user.getValue()
    return (user && user.access && user.access.indexOf(USER_ACCESS_VENTILATIONS) !== -1) ? true : false
  }

  /**
   * Can view Activites
   */
  canViewActivities(user: UserInterface | null = null) {
    user = user || this.user.getValue()
    return (user && user.access && user.access.indexOf(USER_ACCESS_ACTIVITIES) !== -1) ? true : false
  }

  /**
   * Retourne la liste des toutes les pages qu'un utilisateur à accès
   */
  getAllUserPageUrl(user: UserInterface) {
    const menu = []

    menu.push({
      label: 'Panorama',
      path: 'panorama',
    })

    if (this.canViewVentilation(user)) {
      menu.push({
        label: 'Ventilateur',
        path: 'ventilations',
      })
    }
    if (this.canViewActivities(user)) {
      menu.push({
        label: "Données d'activité",
        path: 'donnees-d-activite',
      })
    }

    if (user && user.access && user.access.indexOf(USER_ACCESS_AVERAGE_TIME) !== -1) {
      menu.push({
        label: 'Temps moyens',
        path: 'temps-moyens',
      })
    }

    if (user && user.access && user.access.indexOf(USER_ACCESS_CALCULATOR) !== -1) {
      menu.push({
        label: 'Calculateur',
        path: 'calculateur',
      })
    }

    if (user && user.access && user.access.indexOf(USER_ACCESS_SIMULATOR) !== -1) {
      menu.push({
        label: 'Simulateur',
        path: 'simulateur',
      })
    }

    return menu
  }
}

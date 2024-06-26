import { Injectable, OnInit } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { BackupInterface } from 'src/app/interfaces/backup'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { UserInterface } from 'src/app/interfaces/user-interface'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { ReferentielService } from '../referentiel/referentiel.service'
import {
  USER_ACCESS_ACTIVITIES,
  USER_ACCESS_AVERAGE_TIME,
  USER_ACCESS_CALCULATOR,
  USER_ACCESS_DASHBOARD,
  USER_ACCESS_SIMULATOR,
  USER_ACCESS_VENTILATIONS,
} from 'src/app/constants/user-access'
import { NEED_BOOKING_PAGE } from 'src/app/constants/pages'
import { Router } from '@angular/router'
import { referentielCAMappingColor, referentielCAMappingName, referentielMappingColor, referentielMappingColorActivity, referentielMappingColorCAActivity, referentielMappingName } from 'src/app/utils/referentiel'

/**
 * Service de sauvegarde de l'utilisateur actuel
 */
@Injectable({
  providedIn: 'root',
})
export class UserService implements OnInit {
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
    private router: Router,
    private serverService: ServerService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService
  ) { }

  ngOnInit(): void {
    this.getInterfaceType()
  }

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
   * Get env variable of the interface type
   * @returns
   */
  async getInterfaceType() {
    return this.serverService.get('users/interface-type').then((data) => {
      this.interfaceType = [0, 1].includes(data.data) ? data.data : null
      console.log(this.interfaceType, data)
      return this.interfaceType !== null ? true : false
    })
  }

  isCa() {
    return this.interfaceType === 1
  }

  /**
   * Mapping de la couleur du référentiel selon l'interface
   * @param label 
   * @returns 
   */
  referentielMappingColorByInterface(label: string, opacity: number = 1) {
    if (this.interfaceType === 1)
      return this.referentielCAMappingColor(label, opacity)
    else return this.referentielMappingColor(label, opacity)
  }

  /**
   * Mapping de la couleur des activités selon l'interface
   * @param label 
   * @returns 
   */
  referentielMappingColorActivityByInterface(label: string, opacity: number = 1) {
    if (this.interfaceType === 1)
      return this.referentielMappingColorCAActivity(label, opacity)
    else {
      return this.referentielMappingColorActivity(label, opacity)
    }
  }

  /**
* Mapping des noms de contentieux selon l'interface
* @param label 
* @returns 
*/
  referentielMappingNameByInterface(label: string) {
    if (this.interfaceType === 1)
      return this.referentielCAMappingName(label)
    else return this.referentielMappingName(label)
  }

  /**
   * Methode de reprise des noms de référentiel TJ
   */
  public referentielMappingName(name: string): string {
    return referentielMappingName(name)
  }

  /**
 * Methode de reprise des noms de référentiel CA
 */
  public referentielCAMappingName(name: string): string {
    return referentielCAMappingName(name)
  }

  /**
   * Methode de reprise des couleur des référentiel
   * @param name
   * @returns
   */
  public referentielMappingColor(name: string, opacity: number = 1): string {
    return referentielMappingColor(name, opacity)
  }

  /**
 * Methode de reprise des couleur des référentiel
 * @param name
 * @returns
 */
  public referentielCAMappingColor(name: string, opacity: number = 1): string {
    return referentielCAMappingColor(name, opacity)
  }

  /**
   * Methode de reprise des couleur des référentiel pour l'écran "Données d'activité"
   * @param name
   * @returns
   */
  public referentielMappingColorActivity(name: string, opacity: number = 1): string {
    return referentielMappingColorActivity(name, opacity)
  }

  /**
  * Methode de reprise des couleur des référentiel pour l'écran "Données d'activité"
  * @param name
  * @returns
  */
  public referentielMappingColorCAActivity(name: string, opacity: number = 1): string {
    return referentielMappingColorCAActivity(name, opacity)
  }

  /**
   * API Identification de qui est l'utilisateur connecté
   * @returns
   */
  me() {
    return this.serverService
      .getWithoutError('users/me')
      .then((data) => data.data || null)
  }

  /**
   * API Inscription d'un nouveau utilisateur
   * @param params
   * @returns
   */
  register(params = {}): Promise<any> {
    return this.serverService
      .post('users/create-account', params)
      .then((data) => {
        this.serverService.setToken(data.token)
        return data
      })
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

      // if no backup we need onboarding
      if (result.backups.length === 0) {
        this.serverService.removeToken() // logout user without access
        this.router.navigate(['/' + NEED_BOOKING_PAGE])
      }
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
  canViewPanorama(user: UserInterface | null = null) {
    user = user || this.user.getValue()
    return user &&
      user.access &&
      user.access.indexOf(USER_ACCESS_DASHBOARD) !== -1
      ? true
      : false
  }

  /**
   * Can view Ventilations
   */
  canViewVentilation(user: UserInterface | null = null) {
    user = user || this.user.getValue()
    return user &&
      user.access &&
      user.access.indexOf(USER_ACCESS_VENTILATIONS) !== -1
      ? true
      : false
  }

  /**
   * Can view Activites
   */
  canViewActivities(user: UserInterface | null = null) {
    user = user || this.user.getValue()
    return user &&
      user.access &&
      user.access.indexOf(USER_ACCESS_ACTIVITIES) !== -1
      ? true
      : false
  }

  /**
   * Retourne la liste des toutes les pages qu'un utilisateur à accès
   */
  getAllUserPageUrl(user: UserInterface) {
    const menu = []

    if (this.canViewPanorama(user)) {
      menu.push({
        label: 'Panorama',
        path: 'panorama',
      })
    }

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

    if (
      user &&
      user.access &&
      user.access.indexOf(USER_ACCESS_AVERAGE_TIME) !== -1
    ) {
      menu.push({
        label: 'Temps moyens',
        path: 'temps-moyens',
      })
    }

    if (
      user &&
      user.access &&
      user.access.indexOf(USER_ACCESS_CALCULATOR) !== -1
    ) {
      menu.push({
        label: 'Calculateur',
        path: 'calculateur',
      })
    }

    if (
      user &&
      user.access &&
      user.access.indexOf(USER_ACCESS_SIMULATOR) !== -1
    ) {
      menu.push({
        label: 'Simulateur',
        path: 'simulateur',
      })
    }

    if (
      user &&
      user.access &&
      user.access.indexOf(USER_ACCESS_DASHBOARD) !== -1
    ) {
      menu.push({
        label: 'Extracteurs',
        path: 'dashboard',
      })
    }


    if (menu.length === 0) {
      this.serverService.removeToken() // logout user without access
      menu.push({
        label: 'Bienvenue',
        path: 'bienvenue',
      })
    }

    return menu
  }
}

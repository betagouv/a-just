import { computed, inject, Injectable, OnInit, signal } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { ReferentielService } from '../referentiel/referentiel.service'
import { Router } from '@angular/router'
import { UserInterface } from '../../interfaces/user-interface'
import {
  referentielCAMappingName,
  referentielMappingColor,
  referentielMappingColorActivity,
  referentielMappingColorCAActivity,
  referentielMappingName,
} from '../../utils/referentiel'
import { HRCategoryInterface } from '../../interfaces/hr-category'
import { BackupInterface } from '../../interfaces/backup'
import { NEED_BOOKING_PAGE } from '../../constants/pages'
import {
  USER_ACCESS_ACTIVITIES_READER,
  USER_ACCESS_AVERAGE_TIME_READER,
  USER_ACCESS_CALCULATOR_READER,
  USER_ACCESS_DASHBOARD_READER,
  USER_ACCESS_REAFFECTATOR_READER,
  USER_ACCESS_SIMULATOR_READER,
  USER_ACCESS_SIMULATOR_WRITER,
  USER_ACCESS_WHITE_SIMULATOR_WRITER,
  USER_ACCESS_VENTILATIONS_READER,
  USER_ACCESS_WHITE_SIMULATOR_READER,
  USER_ACCESS_REAFFECTATOR_WRITER,
  USER_ACCESS_CALCULATOR_WRITER,
  USER_ACCESS_AVERAGE_TIME_WRITER,
  USER_ACCESS_ACTIVITIES_WRITER,
  USER_ACCESS_VENTILATIONS_WRITER,
} from '../../constants/user-access'

/**
 * Service de sauvegarde de l'utilisateur actuel
 */
@Injectable({
  providedIn: 'root',
})
export class UserService implements OnInit {
  router = inject(Router)
  serverService = inject(ServerService)
  humanResourceService = inject(HumanResourceService)
  referentielService = inject(ReferentielService)
  interfaceTypeValue = signal<boolean | number | null>(null)
  /**
   * Format de l'utilisateur connecté
   */
  user: BehaviorSubject<UserInterface | null> = new BehaviorSubject<UserInterface | null>(null)
  /**
   * User infos to signal
   */
  userOriginalS = signal<UserInterface | null>(null)
  /**
   * User infos to signal
   */
  userS = signal<UserInterface | null>(null)
  /**
   * User can view simulator
   */
  canViewSimulator = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_SIMULATOR_READER) !== -1 ? true : false
  })
  /**
   * User can view white simulator
   */
  canViewWhiteSimulator = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_WHITE_SIMULATOR_READER) !== -1 ? true : false
  })
  /**
   * User can view reaffectator
   */
  canViewReaffectator = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_REAFFECTATOR_READER) !== -1 ? true : false
  })
  /**
   * User can view cockpit
   */
  canViewRCockpit = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_CALCULATOR_READER) !== -1 ? true : false
  })
  /**
   * User can view white simulator
   */
  canViewTempsMoyens = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_AVERAGE_TIME_READER) !== -1 ? true : false
  })
  /**
   * User can edit simulator
   */
  canEditSimulator = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_SIMULATOR_WRITER) !== -1 ? true : false
  })
  /**
   * User can edit white simulator
   */
  canEditWhiteSimulator = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_WHITE_SIMULATOR_WRITER) !== -1 ? true : false
  })
  /**
   * User can edit reaffectator
   */
  canEditReaffectator = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_REAFFECTATOR_WRITER) !== -1 ? true : false
  })
  /**
   * User can edit average time
   */
  canEditTempsMoyens = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_AVERAGE_TIME_WRITER) !== -1 ? true : false
  })
  /**
   * User can edit activities
   */
  canEditActivities = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_ACTIVITIES_WRITER) !== -1 ? true : false
  })
  /**
   * User can edit calculator
   */
  canEditCalculator = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_CALCULATOR_WRITER) !== -1 ? true : false
  })
  /**
   * User can edit HR
   */
  canEditHR = computed(() => {
    const user = this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_VENTILATIONS_WRITER) !== -1 ? true : false
  })
  /**
   * Interface front TJ ou CA
   */
  interfaceType: number | null = null

  constructor() {
    this.user.subscribe((s) => {
      this.userS.set(
        s
          ? {
              ...s,
              initials: (s.firstName || '').charAt(0) + (s.lastName || '').charAt(0),
            }
          : s,
      )
    })
  }

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
    if (this.interfaceTypeValue() !== null) {
      return Promise.resolve(this.interfaceTypeValue())
    }

    return this.serverService.get('users/interface-type').then((data) => {
      this.interfaceType = [0, 1].includes(data.data) ? data.data : null
      this.interfaceType !== null ? true : false
      this.interfaceTypeValue.set(this.interfaceType)
      return this.interfaceType
    })
  }

  isCa() {
    return this.interfaceType === 1
  }

  isTJ() {
    return this.interfaceType === 0
  }
  /**
   * Mapping de la couleur du référentiel selon l'interface
   * @param label
   * @returns
   */
  referentielMappingColorByInterface(label: string, opacity: number = 1) {
    const name = this.referentielMappingNameByInterface(label)

    if (this.interfaceType === 1) return this.referentielMappingColorCAActivity(name, opacity)
    else return this.referentielMappingColor(name, opacity)
  }

  /**
   * Mapping de la couleur des activités selon l'interface
   * @param label
   * @returns
   */
  referentielMappingColorActivityByInterface(label: string, opacity: number = 1) {
    const name = this.referentielMappingNameByInterface(label)

    if (this.interfaceType === 1) return this.referentielMappingColorCAActivity(name, opacity)
    else return this.referentielMappingColorActivity(name, opacity)
  }

  /**
   * Mapping des noms de contentieux selon l'interface
   * @param label
   * @returns
   */
  referentielMappingNameByInterface(label: string) {
    if (this.interfaceType === 1) return this.referentielCAMappingName(label)
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
    return this.serverService.getWithoutError('users/me').then((data) => data.data || null)
  }

  /**
   * API Inscription d'un nouveau utilisateur
   * @param params
   * @returns
   */
  register(params = {}): Promise<any> {
    return this.serverService.post('users/create-account', params).then((data) => {
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
    return this.serverService.post('users/forgot-password', params).then((data) => data.data || null)
  }

  /**
   * API demande de nouveau mot de passe
   * @param params
   * @returns
   */
  forgotPasswordTest(params = {}): Promise<any> {
    return this.serverService.post('users/forgot-password-test', params).then((data) => data.data || null)
  }

  /**
   * API changement du mot de passe avec code
   * @param params
   * @returns
   */
  changePassword(params = {}): Promise<any> {
    return this.serverService.post('users/change-password', params).then((data) => data.data || null)
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
    return this.serverService.get('users/get-user-datas').then((data) => data.data || null)
  }

  /**
   * Traitement des informations générales comme les catégories, fonctions, juridictions dispo et référentiel
   */
  initDatas() {
    this.getInitDatas().then((result) => {
      this.humanResourceService.categoriesFilterListIds = result.categories.map((c: HRCategoryInterface) => c.id)
      this.humanResourceService.fonctions.next(result.fonctions)
      this.humanResourceService.categories.next(result.categories)
      this.humanResourceService.backups.next(
        result.backups.map((b: BackupInterface) => ({
          ...b,
          date: new Date(b.date),
        })),
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
    return user && user.access && user.access.indexOf(USER_ACCESS_DASHBOARD_READER) !== -1 ? true : false
  }

  /**
   * Can view Ventilations
   */
  canViewVentilation(user: UserInterface | null = null) {
    user = user || this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_VENTILATIONS_READER) !== -1 ? true : false
  }

  /**
   * Can view Activites
   */
  canViewActivities(user: UserInterface | null = null) {
    user = user || this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_ACTIVITIES_READER) !== -1 ? true : false
  }

  /**
   * Can view Activites
   */
  canViewAverageTime(user: UserInterface | null = null) {
    user = user || this.user.getValue()
    return user && user.access && user.access.indexOf(USER_ACCESS_AVERAGE_TIME_READER) !== -1 ? true : false
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

    if (user && user.access && user.access.indexOf(USER_ACCESS_CALCULATOR_READER) !== -1) {
      menu.push({
        label: 'Cockpit',
        path: 'cockpit',
      })
    }

    if (
      user &&
      user.access &&
      (user.access.indexOf(USER_ACCESS_SIMULATOR_READER) !== -1 ||
        user.access.indexOf(USER_ACCESS_WHITE_SIMULATOR_READER) !== -1 ||
        user.access.indexOf(USER_ACCESS_REAFFECTATOR_READER) !== -1)
    ) {
      menu.push({
        label: 'Simulateurs',
        path: 'simulateur',
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

    if (menu.length === 0) {
      this.serverService.removeToken() // logout user without access
      menu.push({
        label: 'Bienvenue',
        path: 'bienvenue',
      })
    }

    return menu
  }

  /**
   * Retourne la page d'accès d'un utilisateur
   */
  redirectToHome() {
    let urlToRedirect = ''

    const user = this.user.getValue()
    if (user) {
      urlToRedirect = this.getUserPageUrl(user)
    }

    window.location.href = urlToRedirect
  }
}

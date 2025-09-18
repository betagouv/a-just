import { inject, Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'
import { ping } from '../../utils/system'

/**
 * Service en lien avec le SSO
 */
@Injectable({
  providedIn: 'root',
})
export class SSOService {
  /**
   * Service de communication avec le serveur
   */
  serverService = inject(ServerService)

  /**
   * Récupération du serveur SSO justice
   * @returns
   */
  serverGetUrl() {
    return this.serverService.get('saml/get-test-url').then((d) => d.data)
  }

  /**
   * Test si serveur SSO justice est accesible
   */
  async canUseSSO() {
    try {
      const url = await this.serverGetUrl()

      if (url) {
        const pingDelay = await ping(url)
        if (pingDelay) {
          return true
        }
      }
    } catch (err) {}
    return false
  }

  /**
   * Récuparation de l'url de login SSO coté A-Just
   */
  getSSOLogin() {
    return this.serverService.getUrl('saml/login')
  }

  /**
   * Récuparation de l'url de login SSO coté A-Just
   */
  getSSOStatus() {
    return this.serverService.get('saml/status').then((s) => {
      if (s && s.token) {
        this.serverService.setToken(s.token)
        return s
      }
      if (s.data) {
        return s.data
      }

      return s
    })
  }

  /**
   * Récuparation de l'url de login SSO coté A-Just
   */
  clearSession() {
    return this.serverService.get('saml/clean-session')
  }
}

import { AfterViewInit, Component, inject } from '@angular/core'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { RouterLink } from '@angular/router'
import { MEETING_URL } from '../../constants/pages'
import { SSOService } from '../../services/sso/sso.service'

/**
 * Page pour onboarder des nouveaux utilisateurs
 */
@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, RouterLink],
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements AfterViewInit {
  /**
   * Service de gestion de l'authentification
   */
  ssoService = inject(SSOService)
  /**
   * URL de la réunion
   */
  MEETING_URL = MEETING_URL

  /**
   * Initialisation de la page
   */
  ngAfterViewInit() {
    const my_awesome_script = document.createElement('script')
    my_awesome_script.setAttribute('type', 'text/javascript')
    my_awesome_script.setAttribute('src', 'https://assets.calendly.com/assets/external/widget.js')
    document.head.appendChild(my_awesome_script)

    this.loadCalendly()
    this.ssoService.clearSession()
  }

  /**
   * Chargement du calendly
   */
  loadCalendly() {
    // @ts-ignore
    if (window.Calendly) {
      // @ts-ignore
      window.Calendly.initInlineWidget({
        url: 'https://calendly.com/support-a-just/support?hide_gdpr_banner=1',
        parentElement: document.getElementById('calendly'),
        prefill: {},
        utm: {},
      })
    } else {
      setTimeout(() => {
        this.loadCalendly()
      }, 100)
    }
  }
}

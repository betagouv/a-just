import { AfterViewInit, Component } from '@angular/core'
import { Router } from '@angular/router'
import { environment } from 'src/environments/environment'
import { USER_ACCESS_AVERAGE_TIME } from './constants/user-access'
import { AlertInterface } from './interfaces/alert'
import { AppService } from './services/app/app.service'
import { ContentieuxOptionsService } from './services/contentieux-options/contentieux-options.service'
import { UserService } from './services/user/user.service'
import { iIOS } from './utils/system'

/**
 * Variable d'environement en global
 */
declare const window: any

/**
 * Composant principal du projet
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  /**
   * Variable pour savoir si on change le serveur
   */
  dbReady: boolean = false
  /**
   * Variable qui permet d'afficher une alert
   */
  alertMessage: AlertInterface | null = null

  /**
   * Constructeur de control SSL + Matomo
   * @param router
   * @param userService
   * @param contentieuxOptionsService
   * @param appService
   */
  constructor(
    router: Router,
    private userService: UserService,
    private contentieuxOptionsService: ContentieuxOptionsService,
    private appService: AppService
  ) {
    if (iIOS()) {
      document.body.classList.add('iIOS')
    }

    this.onControlSSL()
    router.events.subscribe(() => {
      const user = this.userService.user.getValue()
      if (user && this.dbReady === false) {
        this.dbReady = true

        this.userService.initDatas()
        if (user.access && user.access.includes(USER_ACCESS_AVERAGE_TIME)) {
          this.contentieuxOptionsService.initDatas()
        }
      }
    })

    this.appService.alert.subscribe((a) => {
      this.alertMessage = a
    })

    if (environment.matomo !== null) {
      var _paq = (window._paq = window._paq || [])
      _paq.push(['trackPageView'])
      _paq.push(['enableLinkTracking'])
      ;(function () {
        var u = 'https://stats.data.gouv.fr/'
        _paq.push(['setTrackerUrl', u + 'piwik.php'])
        _paq.push(['setSiteId', environment.matomo])
        var d = document,
          g = d.createElement('script'),
          s = d.getElementsByTagName('script')[0]
        g.async = true
        g.src = u + 'piwik.js'
        if (s && s.parentNode) {
          s.parentNode.insertBefore(g, s)
        }
      })()
    }
  }

  ngAfterViewInit(): void {
    this.listenSelectElement()
  }
  /**
   * Control si on est en SSL ou non
   */
  onControlSSL() {
    if (location.protocol !== 'https:' && environment.forceSSL) {
      location.replace(
        `https:${location.href.substring(location.protocol.length)}`
      )
    }
  }

  /**
   * Suppression de l'alert et du texte dans le service
   */
  onCloseAlert() {
    this.appService.alert.next(null)
  }

  listenSelectElement(){
    const elementToObserve = document.body;

    const observer = new MutationObserver(() => {
      const element =
        Array.from(
          document.getElementsByClassName(
            'cdk-overlay-pane'
          ) as HTMLCollectionOf<HTMLElement>
        )[0] || null
      if (element !== null) {
        const delta =
          +element.style.left.replace('px', '') +
          element.getBoundingClientRect().width -
          window.innerWidth
        if (delta > 0)
          element.style.left =
            +element.style.left.replace('px', '') - delta + 'px'
      }
    });

    observer.observe(elementToObserve, { subtree: true, childList: true });
  }
}

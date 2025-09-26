import { AfterViewInit, Component } from '@angular/core'
import { NavigationEnd, Router, RouterOutlet } from '@angular/router'
import { USER_ACCESS_AVERAGE_TIME } from './constants/user-access'
import { AlertInterface } from './interfaces/alert'
import { AppService } from './services/app/app.service'
import { ContentieuxOptionsService } from './services/contentieux-options/contentieux-options.service'
import { UserService } from './services/user/user.service'
import { HumanResourceService } from './services/human-resource/human-resource.service'
import { iIOS } from './utils/system'
import { filter } from 'rxjs'

import { AlertComponent } from './components/alert/alert.component'
import { BigLoaderComponent } from './components/big-loader/big-loader.component'

/**
 * Variable d'environement en global
 */
declare const window: any

/**
 * Composant principal du projet
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AlertComponent, BigLoaderComponent],
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
   * loading
   */
  appLoading = false
  /**
   * Matomo
   */
  matomo: number | null = import.meta.env.NG_APP_MATOMO
  /**
   * MatomoTM
   */
  matomoTM: string | null = import.meta.env.NG_APP_MATOMO_TM

  /**
   * Constructeur de control SSL + Matomo
   * @param router
   * @param userService
   * @param contentieuxOptionsService
   * @param appService
   */
  constructor(router: Router, private userService: UserService, private contentieuxOptionsService: ContentieuxOptionsService, private appService: AppService, private humanResourceService: HumanResourceService) {
    this.crispChat()
    if (iIOS()) {
      document.body.classList.add('iIOS')
    }

    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      // @ts-ignore
      .subscribe((event: NavigationEnd) => {
        this.appService.previousUrl = this.appService.currentUrl
        this.appService.currentUrl = event.url
      })

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

    this.appService.appLoading.subscribe((a) => (this.appLoading = a))

    // Mirror current jurisdiction title for Sentry tagging
    try {
      this.humanResourceService.hrBackup.subscribe((bk) => {
        try {
          window.__ajust_juridiction_title = bk?.label || null
        } catch {}
      })
    } catch {}

    if (this.matomo !== null) {
      var _paq = (window._paq = window._paq || [])
      _paq.push(['trackPageView'])
      _paq.push(['enableLinkTracking'])
      ;(() => {
        var u = 'https://stats.beta.gouv.fr/'
        _paq.push(['setTrackerUrl', u + 'piwik.php'])
        _paq.push(['setSiteId', this.matomo])
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

    console.log(typeof this.matomoTM)
    if (this.matomoTM !== null && this.matomoTM !== 'null') {
      var _mtm = (window._mtm = window._mtm || [])
      _mtm.push({ 'mtm.startTime': new Date().getTime(), event: 'mtm.Start' })
      ;(() => {
        var d = document,
          g = d.createElement('script'),
          s = d.getElementsByTagName('script')[0]
        g.async = true
        g.src = `https://stats.beta.gouv.fr/js/container_${this.matomoTM}.js`
        s.parentNode?.insertBefore(g, s)
      })()
    }

    this.userService.getInterfaceType()
  }

  ngAfterViewInit(): void {
    this.listenSelectElement()
  }

  /**
   * Suppression de l'alert et du texte dans le service
   */
  onCloseAlert(clickToOk = false) {
    const alertObject = this.appService.alert.getValue()
    this.appService.alert.next(null)
    if (clickToOk && alertObject && alertObject.callback) {
      alertObject.callback()
    }
  }

  /**
   * Suppression de l'alert et du texte dans le service
   */
  onCloseAlertSecondary(clickToOk = false) {
    const alertObject = this.appService.alert.getValue()
    this.appService.alert.next(null)
    if (clickToOk && alertObject && alertObject.callbackSecondary) {
      alertObject.callbackSecondary()
    }
  }

  crispChat() {
    window.$crisp = []
    window.CRISP_WEBSITE_ID = import.meta.env.NG_APP_CRISP
    const d = document
    const s: any = d.createElement('script')
    s.src = 'https://client.crisp.chat/l.js'
    s.async = 1
    d.getElementsByTagName('head')[0].appendChild(s)
  }

  listenSelectElement() {
    /*const elementToObserve = document.body;

    const observer = new MutationObserver(r() => {
      const element =
        Array.from(
          document.getElementsByClassName(
            'cdk-overlay-pane'
          ) as HTMLCollectionOf<HTMLElement>
        )[0] || null
      /*if (element !== null) {
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
    */
    /* document.addEventListener(
      'DOMNodeInserted',
      () => {
        console.log('oui')
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
      },
      false
    ) */
  }
}

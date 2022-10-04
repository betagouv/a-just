import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { environment } from 'src/environments/environment'
import { ContentieuxOptionsService } from './services/contentieux-options/contentieux-options.service'
import { UserService } from './services/user/user.service'

declare const window: any

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  dbReady: boolean = false

  constructor(
    router: Router,
    private userService: UserService,
    private contentieuxOptionsService: ContentieuxOptionsService
  ) {
    router.events.subscribe(() => {
      const user = this.userService.user.getValue()
      if (user && this.dbReady === false) {
        this.dbReady = true

        this.userService.initDatas()
        this.contentieuxOptionsService.initDatas()
      }
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
}

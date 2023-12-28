import { AfterViewInit, Component } from '@angular/core'
import { MEETING_URL } from 'src/app/constants/pages'

/**
 * Page pour onboarder des nouveaux utilisateurs
 */
@Component({
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements AfterViewInit {
  MEETING_URL = MEETING_URL

  constructor() { }

  ngAfterViewInit() {
    const my_awesome_script = document.createElement('script')
    my_awesome_script.setAttribute('type', 'text/javascript')
    my_awesome_script.setAttribute(
      'src',
      'https://assets.calendly.com/assets/external/widget.js'
    )
    document.head.appendChild(my_awesome_script)

    this.loadCalendly()
  }

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
      }, 200)
    }
  }
}

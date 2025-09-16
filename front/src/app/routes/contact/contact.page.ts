import { AfterViewInit, Component } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { loadFile } from '../../utils/js-loader'
import { AppService } from '../../services/app/app.service'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { BackButtonComponent } from '../../components/back-button/back-button.component'

/**
 * Hubspot
 */
declare const hbspt: any

/**
 * Contact
 */

@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, BackButtonComponent],
  templateUrl: './contact.page.html',
  styleUrls: ['./contact.page.scss'],
})
export class ContactPage implements AfterViewInit {
  /**
   * Get Link to back
   */
  routerLinkToGoBack: string[] = ['/']

  /**
   * Constructeur
   * @param title
   */
  constructor(
    private title: Title,
    private route: ActivatedRoute,
    private appService: AppService,
  ) {
    this.title.setTitle('Contact | A-Just')
  }

  /**
   * After view init
   */
  ngAfterViewInit() {
    loadFile('https://js-eu1.hsforms.net/forms/embed/v2.js').then(() => {
      hbspt.forms.create({
        region: 'eu1',
        portalId: '26493393',
        formId: '0f776962-cddf-4ccb-b2a8-100936289ebb',
        target: '#hubspotForm',
      })
    })

    const { backUrl } = this.route.snapshot.queryParams
    if (backUrl && backUrl === 'true' && this.appService.previousUrl) {
      this.routerLinkToGoBack = [this.appService.previousUrl]
    }
  }
}

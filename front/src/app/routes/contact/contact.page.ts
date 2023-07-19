import { AfterViewInit, Component } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { AppService } from 'src/app/services/app/app.service'

declare const hbspt: any

/**
 * Contact
 */

@Component({
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
    private appService: AppService
  ) {
    this.title.setTitle('Contact | A-Just')
  }

  ngAfterViewInit() {
    hbspt.forms.create({
      region: 'eu1',
      portalId: '26493393',
      formId: '0f776962-cddf-4ccb-b2a8-100936289ebb',
      target: '#hubspotForm',
    })

    const { backUrl } = this.route.snapshot.queryParams
    if (backUrl && backUrl === 'true' && this.appService.previousUrl) {
      this.routerLinkToGoBack = [this.appService.previousUrl]
    }
  }
}

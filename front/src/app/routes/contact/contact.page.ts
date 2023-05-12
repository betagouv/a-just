import { AfterViewInit, Component } from '@angular/core'
import { Title } from '@angular/platform-browser'

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
   * Constructeur
   * @param title 
   */
  constructor(private title: Title) {
    this.title.setTitle('Contact | A-Just')
  }

  ngAfterViewInit() {
    hbspt.forms.create({
      region: "eu1",
      portalId: "26493393",
      formId: "0f776962-cddf-4ccb-b2a8-100936289ebb",
      target: "#hubspotForm"
    });
  }
}

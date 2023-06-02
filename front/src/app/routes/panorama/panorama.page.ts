import { Component } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  templateUrl: './panorama.page.html',
  styleUrls: ['./panorama.page.scss'],
})
export class PanoramaPage extends MainClass {
  /**
   * Constructor
   */
  constructor() {
    super()
  }
}

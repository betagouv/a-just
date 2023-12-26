import { Component, Input } from '@angular/core'
import { AppService } from 'src/app/services/app/app.service'
import { ServerService } from 'src/app/services/http-server/server.service'
import { downloadFile } from 'src/app/utils/system'

export interface DocCardInterface {
  title: string
  description: string
  image: string
  tag: string
  url: string
  localUrl?: boolean
  download?: boolean
}

@Component({
  selector: 'aj-doc-card',
  templateUrl: './doc-card.component.html',
  styleUrls: ['./doc-card.component.scss'],
})
export class DocCardComponent {
  /**
   * Data card
   */
  @Input() data: DocCardInterface = {
    title: '',
    description: '',
    image: '',
    tag: '',
    url: '',
    download: false,
  }
  /**
   * Localisation du fichier nomenclature
   */
  NOMENCLATURE_DOWNLOAD_URL = '/assets/nomenclature-A-Just.html'
  /**
   * Localisation du fichier nomenclature
   */
  CALCULATRICE_DOWNLOAD_URL =
    '/assets/Calculatrice_de_ventilation_du_temps_par_activité_A-JUST_MAG_et_GRF.xlsx'

  /**
   * Constructeur
   */
  constructor(
    private serverService: ServerService,
    private appService: AppService
  ) {}

  async goTo(url: string) {
    await this.serverService
      .post('centre-d-aide/log-documentation-link', {
        value: url,
      })
      .then((r) => {
        return r.data
      })
    if (this.NOMENCLATURE_DOWNLOAD_URL)
      this.appService.alert.next({
        text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
      })

    console.log(this.data)
    if (this.data.download) {
      downloadFile(url)
    } else {
      window.open(url)
    }
  }
}

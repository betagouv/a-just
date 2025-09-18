import { Component, inject, Input } from '@angular/core'
import { ServerService } from '../../services/http-server/server.service'
import { downloadFile } from '../../utils/system'
import { MatIconModule } from '@angular/material/icon'
import { RouterLink } from '@angular/router'

/**
 * Interface for the doc card
 */
export interface DocCardInterface {
  /**
   * Title
   */
  title: string
  /**
   * Description
   */
  description: string
  /**
   * Image
   */
  image: string
  /**
   * Tag
   */
  tag: string
  /**
   * Url
   */
  url: string
  /**
   * Local url
   */
  localUrl?: boolean
  /**
   * Download
   */
  download?: boolean
}

/**
 * Composant de la carte de documentation
 */
@Component({
  selector: 'aj-doc-card',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './doc-card.component.html',
  styleUrls: ['./doc-card.component.scss'],
})
export class DocCardComponent {
  /**
   * Server service
   */
  serverService = inject(ServerService)
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
  CALCULATRICE_DOWNLOAD_URL = '/assets/Calculatrice_de_ventilation_du_temps_par_activité_A-JUST_MAG_et_GRF.xlsx'

  /**
   * Go to
   * @param url
   */
  async goTo(url: string) {
    await this.serverService
      .post('centre-d-aide/log-documentation-link', {
        value: url,
      })
      .then((r) => {
        return r.data
      })

    console.log(this.data)
    if (this.data.download) {
      downloadFile(url)
    } else {
      window.open(url)
    }
  }
}

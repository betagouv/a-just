import { Component, Input } from '@angular/core';
import { ServerService } from 'src/app/services/http-server/server.service';


export interface DocCardInterface {
  title: string;
  description: string;
  image: string;
  tag: string;
  url: string;
  localUrl?: boolean
}

@Component({
  selector: 'aj-doc-card',
  templateUrl: './doc-card.component.html',
  styleUrls: ['./doc-card.component.scss']
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
  }

  /**
   * Constructeur
   */
  constructor(private serverService: ServerService) { }

  async goTo(url: string) {
    await this.serverService
      .post('centre-d-aide/log-documentation-link',
        {
          value: url,
        })
      .then((r) => {
        return r.data
      })

    window.open(url)
  }
}

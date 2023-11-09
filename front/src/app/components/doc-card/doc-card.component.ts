import { Component, Input } from '@angular/core';


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
  constructor() { }

  goTo(url: string) {
    window.location.href = url;
  }
}

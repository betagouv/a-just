import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { RadioButtonComponent } from '../../../../components/radio-button/radio-button.component';

/**
 * Composant de légende pour les graphiques du simulateur
 */
@Component({
  selector: 'aj-legend-label',
  standalone: true,
  imports: [RadioButtonComponent],
  templateUrl: './legend-label.component.html',
  styleUrls: ['./legend-label.component.scss'],
})
export class LegendLabelComponent implements OnInit, OnChanges {
  /**
   * Titre de la courbe graphique
   */
  @Input() title: string = '';
  /**
   * Couleur 1
   */
  @Input() dotColor: string = '';
  /**
   * Couleur 2
   */
  @Input() bgColor: string = '';
  /**
   * Intitulé
   */
  @Input() label: string = '';
  /**
   * Activation de l'élément
   */
  @Input() disabledEl: boolean = false;
  /**
   * Valeur de sortie du composant
   */
  @Output() value = new EventEmitter();

  /**
   * Action d'affichage ou non d'une courbe sur un graphique
   */
  toogle = {
    label: '',
    checked: true,
  };

  /**
   * Element HTML
   */
  elementRef: HTMLElement | undefined;

  /**
   * Constructeur
   * @param element HTML Element
   */
  constructor(element: ElementRef<HTMLElement>) {
    this.elementRef = element.nativeElement;
  }

  /**
   * A l'initialisation du composant, définir la valeur
   */
  ngOnInit(): void {
    if (this.disabledEl === true) this.toogle.checked = !this.toogle.checked;
  }

  /**
   * Ecoute le changement de valeur du bouton toogle
   */
  ngOnChanges(): void {
    const circleElement = (
      this.elementRef!.getElementsByClassName(
        'circle'
      ) as HTMLCollectionOf<HTMLElement>
    )[0];
    circleElement.style.backgroundColor = this.dotColor;
    const mainElement = (
      this.elementRef!.getElementsByClassName(
        'container'
      ) as HTMLCollectionOf<HTMLElement>
    )[0];

    mainElement.style.backgroundColor = this.bgColor;
    const contenteElement = (
      this.elementRef!.getElementsByClassName(
        'label'
      ) as HTMLCollectionOf<HTMLElement>
    )[0];
    contenteElement.innerHTML = this.label;
  }

  /**
   * Changement de la valeur du toogle button
   * @param event click souris
   */
  updateValue(event: any) {
    this.toogle = event;
    this.value.emit(event);
  }

  /**
   * Evenement 'clicker' sur le bouton
   */
  clicked() {
    this.toogle.checked = !this.toogle.checked;
    this.value.emit(this.toogle);
  }
}

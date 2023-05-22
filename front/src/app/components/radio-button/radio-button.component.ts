import {
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core'

/**
 * Composant radio bouton designer
 */
@Component({
  selector: 'aj-radio-button',
  templateUrl: './radio-button.component.html',
  styleUrls: ['./radio-button.component.scss'],
})
/**
 * Classe RadioButtonComponent
 */
export class RadioButtonComponent implements OnChanges, OnInit {
  /**
   * Tire du bouton
   */
  @Input() title: string = ''
  /**
   * Couleur du switch
   */
  @Input() switchColor: string = '#7befb2'
  /**
   * Paramétrage de la couleur de fond du bouton
   */
  @Input() @HostBinding('style.background-color') bgColor: string = 'white'
  /**
   * Paramétrage de la couleur de bordure du bouton
   */
  @Input() @HostBinding('style.border-color') borderColor: string = 'white'
  /**
   * Paramétrage de la largeur du bouton
   */
  @HostBinding('style.width') @Input() width: string = '25px'
  /**
   * Paramétrage à la hauteur du bouton
   */
  @HostBinding('style.height') @Input() height: string = '15px'
  /**
   * Paramétrage de l'arrondi du bouton
   */
  @HostBinding('style.border-radius') @Input() borderRadius: string = '7.5px'
  /**
   * Paramétrage de la largeur du selecteur
   */
  @Input() indicatorWidth: number = 15 / 2
  /**
   * Paramétrage de la hauteur du selecteur
   */
  @Input() indicatorHeight: number = 15 / 2
  /**
   * Icon à mettre dans l'indicateur
   */
  @Input() icon: string = ''
  /**
   * Bouton modifiable ou non
   */
  @Input() readOnly: boolean = false
  /**
   * Remonté au parent si c'est actif ou non
   */
  @Output() valueChange = new EventEmitter()
  /**
   * Paramétrage et valeur du radio
   */
  @HostBinding('class.selected') @Input() value: boolean = true
  /**
   * Détection d'un clique n'importe où sur le composant
   * @param eventName
   * @param event
   */
  @HostListener('click', ['$event'])

  /**
   * Action lors d'un clique n'importe où sur le composant
   * @param event
   */
  onClick(event: MouseEvent) {
    event.stopPropagation()
    if (!this.readOnly) {
      this.o.checked = !this.o.checked
      this.value = this.o.checked
      this.valueChange.emit(this.o)
    }
  }

  /**
   * State object
   */
  o = {
    label: '',
    checked: true,
  }

  /**
   * A l'initialisation mettre le bon label
   */
  ngOnInit(): void {
    this.o.label = this.title

    this.valueChange.emit(this.o)
  }

  /**
   * Détection du changement de la valeur
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.o.checked = this.value
    }
  }
}

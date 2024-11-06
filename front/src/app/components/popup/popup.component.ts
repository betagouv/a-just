import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostBinding,
  TemplateRef,
} from '@angular/core';

/**
 * Interface des boutons d'actions de la popup
 */
export interface ActionsInterface {
  /**
   * Type d'action
   */
  type?: string;
  /**
   * Force en rouge ou non
   */
  red?: boolean;
  /**
   * Couleur de bouton plainne
   */
  fill?: boolean;
  /**
   * Texte du bouton
   */
  content: string;
  /**
   * Id du bouton
   */
  id: string;
  /**
   * Taille du bouton
   */
  size?: string;
}

/**
 * Composant générique des popin qui affiche un titre, contenu et des boutons d'actions
 */

@Component({
  selector: 'aj-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss'],
})
export class PopupComponent {
  /**
   * Class css qui donne une rendu mobile au besoin
   */
  @HostBinding('class.is-mobile') isMobile = false;
  /**
   * setter du changement de visibilité du contenu
   */
  @Input()
  set visible(d) {
    this._visible = d;
  }
  /**
   * getter du changement de visibilité du contenu
   */
  get visible() {
    return this._visible;
  }
  /**
   * Titre de la fenetre
   */
  @Input() title: string = '';
  /**
   * Titre de la fenetre
   */
  @Input() titleTemplate: TemplateRef<any> | undefined;
  /**
   * Liste des actions possibles données par le parent
   */
  @Input() actions: ActionsInterface[] = [];
  /**
   * Liste des actions mais sur la gauche
   */
  @Input() actionsLeft: ActionsInterface[] = [];
  /**
   * Affichage ou non du bouton fermeture icone
   */
  @Input() closeIcon = false;
  /**
   * Saisie d'une hauteur minimal
   */
  @Input() minHeight: string = '';
  /**
   * Suppression ou non de l'ombre si saisie de "noShadow"
   */
  @Input() removeShadow: string = '';
  /**
   * Remoté au parent de l'action choisie, que ce soit à gauche ou non
   */
  @Output() selectedAction = new EventEmitter();
  /**
   * Remonté au parent de l'envie de fermer la popin
   */
  @Output() onClose = new EventEmitter();
  /**
   * Visible ou non
   */
  _visible = true;
  /**
   * Index de l'option selectionnée
   */
  selectedOptions = 0;

  /**
   * Constructeur
   */
  constructor() {}

  /**
   * Saisie d'une action
   * @param action
   */
  onSelectAction(action: any) {
    this.selectedAction.emit({
      ...action,
      optionValue: this.selectedOptions,
    });
  }

  /**
   * Changement de l'index de l'option selectionnée
   * @param val
   */
  onChangeOption(val: any) {
    this.selectedOptions = val;
  }
}

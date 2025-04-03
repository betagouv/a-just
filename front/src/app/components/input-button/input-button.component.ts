import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainClass } from '../../libs/main-class';
import { MatIconModule } from '@angular/material/icon';

/**
 * Champ de saisie textuelle des formulaires prédesigner
 */

@Component({
  selector: 'aj-input-button',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './input-button.component.html',
  styleUrls: ['./input-button.component.scss'],
})
export class InputButtonComponent extends MainClass {
  /**
   * Input field
   */
  @ViewChild('inputElement') inputElement!: ElementRef;
  /**
   * Titre du bouton
   */
  @Input() title: string | null = null;
  /**
   * Champs par défaut affiché en fond
   */
  @Input() placeholder: string | null = null;
  /**
   * Icone affichée à droite du champ
   */
  @Input() icon: string = 'search';
  /**
   * Valeure du champs
   */
  @Input() value: string | null = null;
  /**
   * Remonter au parent la nouvelle valeure
   */
  @Output() valueChange = new EventEmitter();
  /**
   * Clique sur l'icone pour rechercher
   */
  @Output() search = new EventEmitter();
  /**
   * Blur
   */
  @Output() blur = new EventEmitter<FocusEvent>();

  /**
   * Constructeur
   */
  constructor() {
    super();
  }

  /**
   * Event du clique sur le bouton
   */
  onSearch() {
    this.search.emit();
  }

  /**
   * Event du changement du texte
   */
  onChange() {
    this.valueChange.emit(this.value);
  }

  // Méthode publique pour retirer le focus
  public triggerBlur() {
    this.inputElement.nativeElement.blur();
  }
}
